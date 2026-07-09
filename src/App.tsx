import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  
  const [adbStatus, setAdbStatus] = useState<'disconnected' | 'scanning' | 'found' | 'connected'>('disconnected');
  const [adbDevice, setAdbDevice] = useState('');
  const [adbIp, setAdbIp] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }

      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 1500);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsGenerating(false);
    setIsGenerated(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadLUT = () => {
    const lutContent = `TITLE "SQD电视 Correction LUT"
LUT_3D_SIZE 17
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0

# Mock Data (Identity with slight correction)
# R = r*0.98, G = g*1.02, B = b*1.00
${Array.from({ length: 17 * 17 * 17 }).map((_, i) => {
      const b = Math.floor(i / (17 * 17));
      const g = Math.floor((i % (17 * 17)) / 17);
      const r = i % 17;
      
      const rVal = Math.min(1.0, (r / 16.0) * 0.98).toFixed(6);
      const gVal = Math.min(1.0, (g / 16.0) * 1.02).toFixed(6);
      const bVal = Math.min(1.0, (b / 16.0) * 1.00).toFixed(6);
      
      return `${rVal} ${gVal} ${bVal}`;
    }).join('\n')}
`;
    
    const blob = new Blob([lutContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SQD_Correction.cube';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refreshAdb = () => {
    setAdbStatus('scanning');
    setAdbDevice('');
    setActionStatus('');
    setTimeout(() => {
      setAdbStatus('found');
      setAdbDevice('SQD电视 - 192.168.1.88');
    }, 1000);
  };

  const connectAdb = () => {
    if (adbIp || adbDevice) {
      setAdbStatus('connected');
      setActionStatus('');
    }
  };

  const disconnectAdb = () => {
    setAdbStatus('disconnected');
    setAdbDevice('');
    setAdbIp('');
    setActionStatus('');
  };

  const pushLut = () => {
    setActionStatus('正在将 .cube 转换为 .bin...');
    setTimeout(() => {
      setActionStatus('正在推送校准到设备...');
      setTimeout(() => {
        setActionStatus('校准应用成功。');
      }, 1000);
    }, 1000);
  };

  const bypassLut = () => {
    setActionStatus('校准已旁路，恢复原始颜色管线。');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">SQD电视色彩校准</h1>
        <p className="subtitle">生成用于 SQD电视 色彩校准的校准文件。</p>
      </header>

      {/* Module 1 */}
      <section className="card">
        <h2 className="card-title">什么是 SQD电视色彩校准？</h2>
        <p className="card-text">
          该工具通过生成自定义校准文件，帮助纠正相机/显示系统中的白点和颜色准确性问题。
        </p>
        <p className="card-text" style={{ marginBottom: '8px' }}>该过程包括：</p>
        <ol className="process-list">
          <li>用相机拍摄标准 RGBW 色卡</li>
          <li>上传捕获的图像或视频以生成校准数据</li>
          <li>将校准应用于您的 SQD电视</li>
        </ol>

        <div className="illustrations">
          <div className="illustration-item">
            <div className="rgbw-pattern">
              <div className="r"></div><div className="g"></div>
              <div className="b"></div><div className="w"></div>
              <div className="corner-marker marker-tl"></div>
              <div className="corner-marker marker-tr"></div>
              <div className="corner-marker marker-bl"></div>
              <div className="corner-marker marker-br"></div>
            </div>
            <div className="illustration-caption">标准 RGBW 测试图</div>
          </div>
          <div className="illustration-item">
            <div className="rgbw-pattern captured">
              <div className="r"></div><div className="g"></div>
              <div className="b"></div><div className="w"></div>
              <div className="corner-marker marker-tl"></div>
              <div className="corner-marker marker-tr"></div>
              <div className="corner-marker marker-bl"></div>
              <div className="corner-marker marker-br"></div>
            </div>
            <div className="illustration-caption">相机拍摄画面</div>
          </div>
          <div className="illustration-item">
            <div className="rgbw-pattern corrected">
              <div className="r"></div><div className="g"></div>
              <div className="b"></div><div className="w"></div>
              <div className="corner-marker marker-tl"></div>
              <div className="corner-marker marker-tr"></div>
              <div className="corner-marker marker-bl"></div>
              <div className="corner-marker marker-br"></div>
            </div>
            <div className="illustration-caption">校准后画面</div>
          </div>
        </div>
      </section>

      {/* Module 2 */}
      <section className="card">
        <h2 className="card-title">步骤一：获取并拍摄测试图</h2>
        <div className="card-text">
          <ol className="process-list" style={{ marginBottom: 0 }}>
            <li>进入电视 <strong>设置 - 图像设置 - 色彩 - 色彩风格</strong>，长按遥控器“右键” 4 秒，开启画质校准工具。</li>
            <li>点击 <strong>拍照校准</strong>，然后选择 <strong>专业校准图</strong>。</li>
            <li>使用拍摄设备拍摄电视画面上的测试图，准备在下一步上传。</li>
          </ol>
        </div>
      </section>

      {/* Module 3 */}
      <section className="card">
        <h2 className="card-title">步骤二：上传您的视频素材</h2>
        
        <div className="upload-area" onClick={triggerFileInput}>
          {uploadProgress > 0 && <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="upload-text">上传图片/视频</div>
            <div className="upload-subtext">
              {uploadedFile ? `${uploadedFile.name} (${formatBytes(uploadedFile.size)})` : '点击选择或拖放文件'}
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*,video/*" 
          />
        </div>

        {previewUrl && (
          <div>
            <img src={previewUrl} alt="Preview" className="upload-preview" />
          </div>
        )}
        
        {uploadProgress === 100 && (
          <div className="button-group" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={handleReset} disabled={isGenerating}>
              重置
            </button>
            <button className="btn" onClick={handleGenerate} disabled={isGenerating || isGenerated}>
              {isGenerating ? '校准中...' : isGenerated ? '已校准' : '校准'}
            </button>
          </div>
        )}
      </section>

      {/* Module 4 & 5 */}
      <section className="card">
        <h2 className="card-title">步骤三：下载校准文件</h2>
        <div className="button-group" style={{ marginBottom: '30px' }}>
          <button className="btn" onClick={downloadLUT} disabled={!isGenerated}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            下载校准文件
          </button>
        </div>

        <div className="adb-status-bar">
          <div className={`adb-status ${adbStatus === 'connected' ? 'connected' : ''}`}>
            {adbStatus === 'disconnected' && 'ADB 未连接：未发现设备'}
            {adbStatus === 'scanning' && '正在扫描设备...'}
            {adbStatus === 'found' && 'ADB 已连接：发现 1 个设备'}
            {adbStatus === 'connected' && `ADB 已连接：${adbDevice || adbIp || 'SQD电视'}`}
          </div>
          <button className="btn-text" onClick={refreshAdb}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            刷新
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">ADB 设备</label>
          <select 
            className="form-control" 
            value={adbDevice} 
            onChange={(e) => setAdbDevice(e.target.value)}
            disabled={adbStatus === 'disconnected' || adbStatus === 'scanning'}
          >
            {adbStatus === 'disconnected' && <option value="">未发现设备</option>}
            {(adbStatus === 'found' || adbStatus === 'connected') && (
              <>
                <option value="">选择一个设备</option>
                <option value="SQD电视 - 192.168.1.88">SQD电视 - 192.168.1.88</option>
              </>
            )}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">ADB IP 地址</label>
            <input 
              type="text" 
              className="form-control" 
              value={adbIp}
              onChange={(e) => setAdbIp(e.target.value)}
              placeholder="例如：192.168.1.88" 
            />
          </div>
          <div className="button-group">
            <button className="btn" onClick={connectAdb} disabled={!adbIp && !adbDevice}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              连接
            </button>
            <button className="btn btn-secondary" onClick={disconnectAdb} disabled={adbStatus !== 'connected'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              断开连接
            </button>
          </div>
        </div>

        <div className="button-group">
          <button className="btn" onClick={pushLut} disabled={adbStatus !== 'connected'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            转换并推送校准
          </button>
          <button className="btn btn-secondary" onClick={bypassLut} disabled={adbStatus !== 'connected'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            旁路校准 (Bypass)
          </button>
        </div>

        {actionStatus && (
          <div className="status-message">
            {actionStatus}
          </div>
        )}
      </section>

    </div>
  );
}

export default App;
