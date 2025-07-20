import React, { useState, useEffect } from 'react';
import pouchDBService, { SyncStatus, WindowConfig, WindowEstimate } from '../Services/PouchDBService';

const SyncTest: React.FC = () => {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(pouchDBService.getSyncStatus());
    const [configs, setConfigs] = useState<WindowConfig[]>([]);
    const [estimates, setEstimates] = useState<WindowEstimate[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Subscribe to sync status updates
        const unsubscribe = pouchDBService.onSyncStatusChange(setSyncStatus);
        
        // Load initial data
        loadData();

        return unsubscribe;
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configData, estimateData] = await Promise.all([
                pouchDBService.getWindowConfig(),
                pouchDBService.getEstimates()
            ]);
            setConfigs(configData);
            setEstimates(estimateData);
        } catch (error) {
            console.error('Failed to load data:', error);
            setMessage(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleForceSync = async () => {
        setLoading(true);
        setMessage('');
        try {
            await pouchDBService.forceSync();
            await loadData();
            setMessage('Force sync completed successfully!');
        } catch (error) {
            console.error('Force sync failed:', error);
            setMessage(`Force sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestConfig = async () => {
        setLoading(true);
        setMessage('');
        try {
            const testConfig = {
                type: 'window_type' as const,
                name: `Test Window ${Date.now()}`,
                price: Math.floor(Math.random() * 1000) + 100,
                description: 'Test window type created from sync test',
                category: 'test'
            };
            
            await pouchDBService.saveWindowConfig(testConfig);
            await loadData();
            setMessage('Test configuration added successfully!');
        } catch (error) {
            console.error('Failed to add test config:', error);
            setMessage(`Failed to add test config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestEstimate = async () => {
        setLoading(true);
        setMessage('');
        try {
            const testEstimate = {
                customerName: 'Test Customer',
                customerEmail: 'test@example.com',
                customerPhone: '01234567890',
                customerAddress: '123 Test Street, Test City, TE1 2ST',
                windows: [
                    {
                        id: '1',
                        type: 'casement',
                        width: 1200,
                        height: 1000,
                        quantity: 2,
                        price: 450
                    }
                ],
                totalPrice: 900,
                createdAt: new Date().toISOString(),
                status: 'draft' as const
            };
            
            await pouchDBService.saveEstimate(testEstimate);
            await loadData();
            setMessage('Test estimate added successfully!');
        } catch (error) {
            console.error('Failed to add test estimate:', error);
            setMessage(`Failed to add test estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: SyncStatus) => {
        if (!status.isOnline) return 'text-red-600';
        if (status.syncInProgress) return 'text-yellow-600';
        if (status.error) return 'text-red-600';
        return 'text-green-600';
    };

    const getStatusText = (status: SyncStatus) => {
        if (!status.isOnline) return 'Offline';
        if (status.syncInProgress) return 'Syncing...';
        if (status.error) return `Error: ${status.error}`;
        return 'Online & Synced';
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">PouchDB Sync Test</h2>
                
                {/* Sync Status */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Sync Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Status: </span>
                            <span className={getStatusColor(syncStatus)}>
                                {getStatusText(syncStatus)}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Last Sync: </span>
                            <span>{syncStatus.lastSync ? syncStatus.lastSync.toLocaleString() : 'Never'}</span>
                        </div>
                        <div>
                            <span className="font-medium">Docs Read: </span>
                            <span>{syncStatus.docsRead}</span>
                        </div>
                        <div>
                            <span className="font-medium">Docs Written: </span>
                            <span>{syncStatus.docsWritten}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-6 flex flex-wrap gap-3">
                    <button
                        onClick={handleForceSync}
                        disabled={loading || !syncStatus.isOnline}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Force Sync
                    </button>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Reload Data
                    </button>
                    <button
                        onClick={handleAddTestConfig}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Test Config
                    </button>
                    <button
                        onClick={handleAddTestEstimate}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Test Estimate
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-4 p-3 rounded-md ${
                        message.includes('Error') || message.includes('failed') 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
                        Loading...
                    </div>
                )}

                {/* Data Display */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Configurations */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Window Configurations ({configs.length})</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {configs.map((config) => (
                                <div key={config._id} className="p-3 bg-gray-50 rounded-md text-sm">
                                    <div className="font-medium">{config.name}</div>
                                    <div className="text-gray-600">
                                        Type: {config.type} | Price: £{config.price}
                                    </div>
                                    {config.description && (
                                        <div className="text-gray-500 text-xs mt-1">{config.description}</div>
                                    )}
                                </div>
                            ))}
                            {configs.length === 0 && (
                                <div className="text-gray-500 text-center py-4">No configurations found</div>
                            )}
                        </div>
                    </div>

                    {/* Estimates */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Estimates ({estimates.length})</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {estimates.map((estimate) => (
                                <div key={estimate._id} className="p-3 bg-gray-50 rounded-md text-sm">
                                    <div className="font-medium">{estimate.customerName}</div>
                                    <div className="text-gray-600">
                                        Total: £{estimate.totalPrice} | Status: {estimate.status}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        {estimate.windows.length} window(s) | {new Date(estimate.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {estimates.length === 0 && (
                                <div className="text-gray-500 text-center py-4">No estimates found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncTest;
