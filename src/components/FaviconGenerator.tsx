'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Upload, Download, CheckCircle, XCircle, Image as ImageIcon, Heart } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import 'react-image-crop/dist/ReactCrop.css';

interface FaviconGeneratorProps {}

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

const FaviconGenerator: React.FC<FaviconGeneratorProps> = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [cropShape, setCropShape] = useState<'square' | 'circle'>('square');
  const [generatedFavicons, setGeneratedFavicons] = useState<string[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [error, setError] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCroppedImage = useCallback(
    (canvas: HTMLCanvasElement, image: HTMLImageElement, crop: PixelCrop) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * pixelRatio;
      canvas.height = crop.height * pixelRatio;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
    },
    []
  );

  const generateFavicon = async (size: number) => {
    if (!imgRef.current || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = size;
    canvas.height = size;

    drawCroppedImage(canvas, imgRef.current, completedCrop);

    // If circle crop, apply circular mask
    if (cropShape === 'circle') {
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2;

      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor(i / 4 / size);
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (distance > radius) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL('image/png');
  };

  const handleGenerateFavicons = async () => {
    if (!imgRef.current || !completedCrop) return;

    setGenerationState('generating');
    setError('');
    
    try {
      const sizes = [16, 32, 48, 64, 96, 128, 192, 256];
      const favicons: string[] = [];

      for (const size of sizes) {
        const favicon = await generateFavicon(size);
        if (favicon) {
          favicons.push(favicon);
        }
      }

      if (favicons.length === sizes.length) {
        setGeneratedFavicons(favicons);
        setGenerationState('success');
      } else {
        setError('Some favicons failed to generate');
        setGenerationState('error');
      }
    } catch (err) {
      setError('Failed to generate favicons. Please try again.');
      setGenerationState('error');
    }
  };

  const downloadFavicon = (dataUrl: string, size: number) => {
    const link = document.createElement('a');
    link.download = `favicon-${size}x${size}.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadAllFavicons = () => {
    const sizes = [16, 32, 48, 64, 96, 128, 192, 256];
    generatedFavicons.forEach((favicon, index) => {
      downloadFavicon(favicon, sizes[index]);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Favicon Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Upload an image and generate favicons in multiple sizes
          </p>
        </div>

        {/* Empty State */}
        {!selectedFile && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No image selected</h3>
              <p className="text-gray-600 dark:text-gray-300">Upload an image to get started</p>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Image</h2>
          </div>
          
          <div className="relative">
            <input
              aria-label="Upload Image"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer cursor-pointer"
            />
            <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Image Cropping */}
        {imageSrc && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crop Image</h2>
            </div>
            
            {/* Shape Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Crop Shape:</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="square"
                    checked={cropShape === 'square'}
                    onChange={(e) => setCropShape(e.target.value as 'square' | 'circle')}
                    className="mr-2 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Square</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="circle"
                    checked={cropShape === 'circle'}
                    onChange={(e) => setCropShape(e.target.value as 'square' | 'circle')}
                    className="mr-2 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Circle</span>
                </label>
              </div>
            </div>

            {/* Crop Area */}
            <div className="flex justify-center mb-6">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={cropShape === 'circle'}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </ReactCrop>
            </div>

            <div className="text-center">
              <button
                onClick={handleGenerateFavicons}
                disabled={!completedCrop || generationState === 'generating'}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                {generationState === 'generating' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  'Generate Favicons'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {generationState === 'error' && (
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/20 dark:border-red-800/20 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Generation Failed</h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {generationState === 'success' && (
          <div className="bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm border border-green-200/20 dark:border-green-800/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">Favicons Generated!</h3>
                <p className="text-green-600 dark:text-green-300">All favicons have been generated successfully.</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Favicons */}
        {generatedFavicons.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Favicons</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {generatedFavicons.map((favicon, index) => {
                const sizes = [16, 32, 48, 64, 96, 128, 192, 256];
                const size = sizes[index];
                return (
                  <div key={index} className="text-center">
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 rounded-xl p-4 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors">
                      <img
                        src={favicon}
                        alt={`Favicon ${size}x${size}`}
                        className="mx-auto mb-2 rounded-lg"
                        style={{ width: Math.min(size, 64), height: Math.min(size, 64) }}
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{size}x{size}</p>
                      <button
                        onClick={() => downloadFavicon(favicon, size)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={downloadAllFavicons}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                Download All Favicons
              </button>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">How to use your favicons:</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300"><strong>For HTML:</strong> Add to your &lt;head&gt; section:</p>
            <pre className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg text-xs overflow-x-auto border border-gray-200/20 dark:border-gray-700/20">
{`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="apple-touch-icon" sizes="192x192" href="/favicon-192x192.png">`}
            </pre>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/20 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span>Developed by</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">ivanthedev</span>
              <span>with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Theme:</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FaviconGenerator;
