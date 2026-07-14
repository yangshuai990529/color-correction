import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success'>('idle');

  // Get initial query parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      model: params.get('model') || '',
      dnum: params.get('dnum') || '',
    };
  };

  const [deviceInfo, setDeviceInfo] = useState(getUrlParams());

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
    setImportStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    setImportStatus('importing');
    setTimeout(() => {
      setImportStatus('success');
    }, 1500);
  };

  const simulateScan = (model: string, dnum: string) => {
    const newUrl = `${window.location.pathname}${model ? `?model=${model}&dnum=${dnum}` : ''}`;
    window.history.pushState({}, '', newUrl);
    setDeviceInfo({ model, dnum });
    handleReset();
  };

  const isDeviceConnected = deviceInfo.model !== '' && deviceInfo.dnum !== '';
  const isDeviceMatched = isDeviceConnected && deviceInfo.model.toUpperCase().includes('SQD');
  const isUnlocked = isDeviceMatched;

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

      {/* Simulator Control Bar */}
      <div className="simulator-bar">
        <span className="simulator-label">📱 扫码模拟器:</span>
        <button 
          className={`simulator-btn ${deviceInfo.model === 'SQD-TV-85' ? 'active' : ''}`}
          onClick={() => simulateScan('SQD-TV-85', 'D1002394')}
        >
          扫码接入匹配机型 (SQD-TV-85)
        </button>
        <button 
          className={`simulator-btn ${deviceInfo.model === 'Xiaomi-TV-65' ? 'active' : ''}`}
          onClick={() => simulateScan('Xiaomi-TV-65', 'D99988877')}
        >
          扫码接入不匹配机型 (Xiaomi-TV-65)
        </button>
        <button 
          className={`simulator-btn ${!deviceInfo.model ? 'active' : ''}`}
          onClick={() => simulateScan('', '')}
        >
          断开连接 (直接访问)
        </button>
      </div>

      {/* Device Connection Status Card */}
      <section className="card device-status-card">
        <h2 className="card-title">设备连接状态</h2>
        {!isDeviceConnected ? (
          <div className="status-alert warning">
            <div className="status-alert-icon">⚠️</div>
            <div className="status-alert-content">
              <div className="status-alert-title">未发现已连接设备</div>
              <div className="status-alert-desc">
                本工具需要连接电视设备。请使用手机扫描电视端“画质校准工具”中的二维码访问此页面。
              </div>
            </div>
          </div>
        ) : !isDeviceMatched ? (
          <div className="status-alert error">
            <div className="status-alert-icon">❌</div>
            <div className="status-alert-content">
              <div className="status-alert-title">设备机型不匹配</div>
              <div className="status-alert-desc">
                已识别到设备 <strong>{deviceInfo.model}</strong>，但该机型不匹配本校准算法。请使用兼容的 SQD 系列电视进行校准。
              </div>
            </div>
          </div>
        ) : (
          <div className="status-alert success-connection">
            <div className="status-alert-icon">✓</div>
            <div className="status-alert-content">
              <div className="status-alert-title">设备已连接且匹配成功</div>
              <div className="status-alert-desc">
                已成功连接至：<strong>SQD 电视 ({deviceInfo.model})</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Module 1 */}
      <section className="card">
        <h2 className="card-title">什么是 SQD电视色彩校准？</h2>
        <p className="card-text">
          该工具通过生成自定义校准文件，帮助纠正相机/显示系统中的白点和颜色准确性问题。
        </p>
        <p className="card-text" style={{ marginBottom: '8px' }}>该过程包括：</p>
        <ol className="process-list">
          <li>用相机拍摄标准 RGBW 色卡</li>
          <li>上传捕获的图像或视频以生成校准 data</li>
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

      {/* Steps Wrapper to apply lock mechanism */}
      <div className="steps-wrapper">
        <div className={`steps-container ${!isUnlocked ? 'blur-content' : ''}`}>
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
            <h2 className="card-title">步骤三：下载并导入校准文件</h2>
            <div className="button-group">
              <button className="btn" onClick={downloadLUT} disabled={!isGenerated || importStatus === 'importing'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                下载校准文件
              </button>
              <button className="btn btn-secondary" onClick={handleImport} disabled={!isGenerated || importStatus === 'importing'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                {importStatus === 'importing' ? '正在导入...' : '一键导入当前设备'}
              </button>
            </div>

            {importStatus === 'importing' && (
              <div className="status-message">
                正在上传并应用校准文件到当前设备...
              </div>
            )}
            {importStatus === 'success' && (
              <div className="status-message success">
                ✓ 校准文件已成功应用到当前设备！
              </div>
            )}
          </section>
        </div>

        {!isUnlocked && (
          <div className="steps-lock-overlay">
            <div className="lock-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <h3>校准步骤已锁定</h3>
              <p>请先在上方连接匹配的 SQD 电视设备以解锁校准步骤</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
