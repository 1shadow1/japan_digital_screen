import React, { useState, useEffect, useRef } from 'react';
import './CameraFeed.css';

export interface CameraData {
	id: number;
	name?: string;
	location?: string;
	status?: string;
	quality?: string;
	resolution?: string;
	fps?: number;
	lastUpdate?: number;
	lastUpdateTime?: string;
	temperature?: number | null;
	connectivity?: number;
	recording?: boolean;
	nightVision?: boolean;
	motionDetection?: boolean;
}

export interface CameraFeedProps {
	pondId: number;
	camera: CameraData;
	refreshTrigger: number;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ pondId, camera, refreshTrigger }) => {
	const [imageUrl, setImageUrl] = useState<string>('');
	const [imageLoading, setImageLoading] = useState<boolean>(false);
	const [imageError, setImageError] = useState<boolean>(false);
	const [retryTrigger, setRetryTrigger] = useState<number>(0);

	const actualCameraId = camera.id || (camera as any).device_id || (camera as any).camera_id;
	const isOffline = camera.status === '离线' || camera.status === 'offline';

	const fetchImage = async () => {
		if (!actualCameraId || isOffline) return;

		setImageLoading(true);
		setImageError(false);

		try {
			const res = await fetch(`/api/v1/ponds/${pondId}/cameras/${actualCameraId}/image`, {
				method: 'GET',
				headers: { Accept: 'image/*' },
				signal: AbortSignal.timeout(10000),
			});

			if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
			const blob = await res.blob();
			if (blob.size === 0) throw new Error('Empty Blob');

			const newUrl = URL.createObjectURL(blob);
			setImageUrl(prev => {
				if (prev) URL.revokeObjectURL(prev);
				return newUrl;
			});
		} catch (err) {
			console.error('获取摄像头图片失败:', err);
			setImageError(true);
		} finally {
			setImageLoading(false);
		}
	};

	const lastFetchRef = useRef<string>('');

	useEffect(() => {
		console.warn('fetchImage', refreshTrigger, retryTrigger);
		const currentKey = `${refreshTrigger}-${retryTrigger}`;

		if (!refreshTrigger || lastFetchRef.current === currentKey) return;

		lastFetchRef.current = currentKey;
		fetchImage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshTrigger, retryTrigger]);

	// 组件卸载时销毁最终的 Blob URL
	useEffect(() => {
		return () => {
			setImageUrl(prev => {
				if (prev) URL.revokeObjectURL(prev);
				return '';
			});
		};
	}, []);

	return (
		<div className={`camera-feed ${isOffline ? 'offline' : ''}`}>
			{/* 摄像头信息头部 */}
			<div className='camera-header'>
				<div className='camera-info'>
					<h4 className='camera-name'>{camera.name || `摄像头 ${actualCameraId || '未知'}`}</h4>
					<span className='camera-location'>{camera.location || '未知位置'}</span>
				</div>
				<div className='camera-status'>
					<span className={`status-indicator ${!isOffline ? 'online' : 'offline'}`}>
						{camera.status || '未知状态'}
					</span>
				</div>
			</div>

			{/* 图像显示区域 */}
			<div className='camera-display'>
				<div className='image-container'>
					{!isOffline ? (
						<div className='image-wrapper'>
							{imageLoading && (
								<div className='image-loading-overlay'>
									<div className='spinner'></div>
									<p>正在拉取新图片...</p>
								</div>
							)}

							{imageError ? (
								<div className='image-error-overlay'>
									<div className='error-content'>
										<span className='error-icon'>📷</span>
										<p>图片获取失败</p>
										<button
											onClick={() => setRetryTrigger(prev => prev + 1)}
											className='retry-image-button'
										>
											重新尝试
										</button>
									</div>
								</div>
							) : imageUrl ? (
								<img
									src={imageUrl}
									alt={`摄像头 ${actualCameraId} 画面`}
									className='camera-image'
									onError={() => setImageError(true)}
								/>
							) : null}
						</div>
					) : (
						<div className='offline-placeholder'>
							<div className='offline-content'>
								<span className='offline-icon'>📷</span>
								<h3>摄像头离线</h3>
								<p>设备当前不可用</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 技术参数 */}
			<div className='camera-footer'>
				<div className='tech-info'>
					<span className='resolution'>{camera.resolution || '1080P'}</span>
					<span className='separator'>|</span>
					<span className='update-time'>
						{camera.lastUpdateTime || new Date().toLocaleTimeString('ja-JP')}
					</span>
				</div>
			</div>
		</div>
	);
};;;

export default CameraFeed;
