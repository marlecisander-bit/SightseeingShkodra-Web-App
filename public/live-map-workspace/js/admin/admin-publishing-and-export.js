(function() {
    window.app.endAdminSession = function() {
        window.app.state.authRevision = (window.app.state.authRevision || 0) + 1;
        window.app.state.currentUser = null;
        window.app.state.currentProject = null;
        window.app.state.loadedMapProjectId = undefined;
        document.getElementById('login-screen').style.display = 'none';
        document.dispatchEvent(new CustomEvent('adminsessionended'));
    };
    const exportLoads = new Map();
    function loadExportLibrary(url) {
        if (!exportLoads.has(url)) exportLoads.set(url, new Promise(function(resolve, reject) {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = function() { script.remove(); exportLoads.delete(url); reject(new Error('Export library unavailable')); };
            document.head.appendChild(script);
        }));
        return exportLoads.get(url);
    }
    function downloadBlob(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function() { URL.revokeObjectURL(link.href); }, 1000);
    }

    async function saveVersion(status) {
        const state=window.app.state,w=window.adminWorkflow,user=state.currentUser,projectId=window.appConfig.projectId;
        if(window.appConfig.ownerAcceptanceReadOnly){window.app.helpers.showToast("Read-only owner acceptance preview. Save and Publish are tested with isolated fixtures.");return null;}
        if(state.mapSaveInFlight)return null;
        if(state.mapLoadInFlight||state.loadedMapProjectId!==projectId){window.app.helpers.showToast('Wait for this project’s map to load before saving.');return null;}
        if(!user||!state.currentProject){window.app.helpers.showToast('Sign in and select a project first.');return null;}
        if(w.formDirty){window.app.helpers.showToast('Apply the open editor changes locally before saving.');return null;}
        if(w.uncertain){window.app.helpers.showToast('Save outcome uncertain. Reload to reconcile before retrying.');return null;}
        let data;
        try{data=JSON.parse(JSON.stringify(adminBuildFeatureCollection()));window.geoJsonValidation.validate(data,new TextEncoder().encode(JSON.stringify(data)).length);window.routeValidation.validate(data);}
        catch(error){window.app.helpers.showToast('Map validation: '+error.message);return null;}
        if(status==='published'&&(window.adminMapData.currentStatus!=='draft'||w.hasUnsaved())){window.app.helpers.showToast('Save a valid draft before publishing. Unsaved changes cannot be published.');return null;}
        if(status==='draft'&&!w.hasUnsaved()){window.app.helpers.showToast('No unsaved changes to save.');return null;}
        state.mapSaveInFlight=true;
        const authRevision=state.authRevision||0,revision=window.adminMapData.changeRevision,client=window.app.supabase.getClient();
        const area=document.getElementById('map-area');if(area)area.inert=true;
        window.app.helpers.setLoading(true,status==='published'?'Publishing saved draft...':'Saving draft...');
        let submitted=false;
        async function persist(){
            const access=await client.rpc('is_tracking_admin',{p:projectId});if(access.error)throw access.error;if(access.data!==true)throw new Error('Map editing permission is no longer available.');
            await w.checkHead(client,projectId);
            if(authRevision!==(state.authRevision||0)||user.id!==state.currentUser?.id||projectId!==window.appConfig.projectId)throw new Error('Session changed. Sign in and reload before saving.');
            const requestId=window.crypto.randomUUID();
            const payload={p_project:projectId,p_expected_head:w.headId,p_expected_published:w.publishedId,p_expected_draft:w.draftId,p_status:status,p_map:data,p_request:requestId};
            submitted=true;
            const result=await client.rpc('save_tracking_map',payload);
            if(result.error)throw result.error;
            if(!result.data?.id)throw new Error('Save receipt missing. Reload to reconcile.');
            if(authRevision!==(state.authRevision||0)||user.id!==state.currentUser?.id||projectId!==window.appConfig.projectId)return result.data;
            window.adminMapData.currentVersionId=result.data.id;window.adminMapData.currentStatus=status;w.saved(result.data,data);
            if(revision===window.adminMapData.changeRevision){window.adminMapData.hasChanges=false;state.unpublishedChanges=0;const count=document.getElementById('unpublished-count');if(count){count.textContent='0';count.hidden=true;}}
            window.app.helpers.showToast(status==='published'?'Saved draft published. Visitors update on their next map refresh.':'Draft saved. The public route is unchanged.');return result.data;
        }
        try{return await (window.navigator?.locks?window.navigator.locks.request('shkodra-cms-'+projectId,{ifAvailable:true},lock=>{if(!lock)throw new Error('Another browser tab is saving. Wait and reload before saving.');return persist();}):persist());}
        catch(error){if(submitted&&!/^(42501|40001|22023|235[0-9A-Z]{2})$/.test(error.code||''))w.uncertain=true;window.app.helpers.showToast((w.uncertain?'Save outcome uncertain; reload before retrying. ':'Save failed: ')+error.message);return null;}
        finally{state.mapSaveInFlight=false;if(area)area.inert=false;window.app.helpers.setLoading(false);}
    }

    function geoJsonToSvg(data) {
        const width = 1200, height = 800, padding = 50;
        const coordinates = [];
        data.features.forEach(function(feature) {
            const geometry = feature.geometry || {};
            if (geometry.type === 'Point') coordinates.push(geometry.coordinates);
            if (geometry.type === 'LineString') geometry.coordinates.forEach(function(point) { coordinates.push(point); });
        });
        if (!coordinates.length) return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"></svg>';
        const xs = coordinates.map(function(p) { return p[0]; });
        const ys = coordinates.map(function(p) { return p[1]; });
        const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
        const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
        const project = function(p) {
            const x = padding + ((p[0] - minX) / (maxX - minX || 1)) * (width - padding * 2);
            const y = height - padding - ((p[1] - minY) / (maxY - minY || 1)) * (height - padding * 2);
            return [x, y];
        };
        let content = '<rect width="100%" height="100%" fill="white"/>';
        data.features.forEach(function(feature) {
            const p = feature.properties || {}, geometry = feature.geometry || {};
            if (geometry.type === 'LineString') {
                const points = geometry.coordinates.map(project).map(function(point) { return point.join(','); }).join(' ');
                content += '<polyline points="' + points + '" fill="none" stroke="' + window.mapContentSafety.escape(p.color || '#d90000') + '" stroke-width="' + window.mapContentSafety.escape(p.weight || 6) + '" stroke-linecap="round" stroke-linejoin="round"/>';
            }
            if (geometry.type === 'Point') {
                const point = project(geometry.coordinates);
                content += '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="12" fill="white" stroke="#d90000" stroke-width="4"/>';
                content += '<text x="' + point[0] + '" y="' + (point[1] + 4) + '" text-anchor="middle" font-family="Arial" font-size="11">' + window.mapContentSafety.escape(p.stopNumber || '•') + '</text>';
            }
        });
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' + content + '</svg>';
    }

    const actions = {
        saveDraft: function() { return saveVersion('draft'); },
        publishMap: async function() {
            if (window.app.state.mapSaveInFlight || !window.confirm('Publish the last saved draft for all visitors?')) return null;
            return saveVersion('published');
        },
        exportGeoJSON: function() {
            const json = JSON.stringify(adminBuildFeatureCollection(), null, 2);
            downloadBlob(new Blob([json], { type: 'application/geo+json' }), 'sightseeing-shkodra-map.geojson');
        },
        triggerGeoJsonImport: function() { document.getElementById('import-file').click(); },
        importGeoJSON: function(event) {
            const file = event && event.target && event.target.files ? event.target.files[0] : null;
            if (!file) return;
            if (file.size > window.geoJsonValidation.MAX_BYTES) {
                window.app.helpers.showToast('Map files must be at most 5 MB.');
                event.target.value = '';
                return;
            }
            if (window.app.state.mapLoadInFlight || !window.app.state.currentUser) { window.app.helpers.showToast('Sign in and wait for your map to load before importing.'); event.target.value = ''; return; }
            const projectAtImport = window.appConfig.projectId;
            const revisionAtImport = window.adminMapData.changeRevision;
            const authAtImport = window.app.state.authRevision || 0;
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const data = JSON.parse(reader.result);
                    if (projectAtImport !== window.appConfig.projectId || authAtImport !== (window.app.state.authRevision || 0) || revisionAtImport !== window.adminMapData.changeRevision || window.app.state.mapLoadInFlight) throw new Error('The map or session changed while reading the file. Please import again.');
                    window.geoJsonValidation.validate(data, file.size);
                    adminRenderMapData(data);
                    adminMarkChanged();
                    window.app.helpers.showToast('GeoJSON imported');
                } catch (error) {
                    window.app.helpers.showToast(error.message || 'Invalid GeoJSON file');
                }
                event.target.value = '';
            };
            reader.onerror = function() { window.app.helpers.showToast('The map file could not be read.'); event.target.value = ''; };
            reader.readAsText(file);
        },
        exportMapNow: async function() {
            const status = document.getElementById('export-map-status');
            const format = document.getElementById('export-map-format').value;
            const title = document.getElementById('export-map-title').value.trim() || 'Sightseeing Shkodra';
            if (status) status.textContent = 'Preparing export...';
            try {
                if (format === 'svg') {
                    downloadBlob(new Blob([geoJsonToSvg(adminBuildFeatureCollection())], { type: 'image/svg+xml' }), title + '.svg');
                } else {
                    await loadExportLibrary('/live-map-workspace/vendor/html2canvas.js');
                    if (format === 'pdf') await loadExportLibrary('/live-map-workspace/vendor/jspdf.js');
                    const scale = Number(document.getElementById('export-map-scale').value) || 2;
                    const canvas = await html2canvas(document.getElementById('map-area'), { useCORS: true, scale: scale, backgroundColor: '#ffffff' });
                    if (format === 'pdf') {
                        const jsPDF = window.jspdf && window.jspdf.jsPDF;
                        const pdf = new jsPDF({ orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
                        pdf.save(title + '.pdf');
                    } else {
                        canvas.toBlob(function(blob) { downloadBlob(blob, title + '.png'); }, 'image/png');
                    }
                }
                if (status) status.textContent = 'Export complete.';
            } catch (error) {
                console.error(error);
                if (status) status.textContent = 'Export failed. The map tiles may block image export.';
            }
        }
    };

    window.app.registerActionGroup('adminPublishing', actions);

    document.addEventListener('DOMContentLoaded', async function() {
        window.app.state.currentUser = { id: window.appConfig.workspaceProjectId };
        document.getElementById('login-screen').style.display = 'none';
        try {
            await window.app.projects.load();
            await window.app.projectLoadPromise;
        } catch {
            window.app.endAdminSession();
            window.app.helpers.showToast('The tracking workspace could not load. Reconnect your tracking account from the website admin.');
        }
    });
})();
