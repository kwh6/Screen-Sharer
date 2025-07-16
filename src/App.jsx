import React, { useState, useRef } from 'react';
import Peer from 'peerjs';

export default function App() {
  const [role, setRole] = useState(null); // 'presenter' | 'viewer'
  const [stream, setStream] = useState(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);

  const peerOptions = {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 2,
  };

  const startViewer = () => {
    setRole('viewer');
    const peer = new Peer('viewer', peerOptions);
    peerRef.current = peer;

    peer.on('open', () => console.log('Viewer ready'));
    peer.on('call', call => {
      call.answer();
      call.on('stream', remoteStream => {
        if (remoteRef.current) {
          remoteRef.current.srcObject = remoteStream;
        }
      });
      callRef.current = call;
    });
  };

  const startPresenter = async () => {
    setRole('presenter');
    const peer = new Peer('presenter', peerOptions);
    peerRef.current = peer;

    peer.on('open', async () => {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100
        }
      });

        setStream(screenStream);
        if (localRef.current) localRef.current.srcObject = screenStream;

        const call = peer.call('viewer', screenStream);
        callRef.current = call;
      } catch (err) {
        alert('Could not share screen: ' + err.message);
        setRole(null);
      }
    });
  };

  const reset = () => {
    peerRef.current?.destroy();
    callRef.current?.close();

    [localRef, remoteRef].forEach(ref => {
      if (ref.current && ref.current.srcObject) {
        ref.current.srcObject.getTracks().forEach(t => t.stop());
        ref.current.srcObject = null;
      }
    });

    setStream(null);
    setRole(null);
  };

  const enterFullScreen = () => {
  const video = remoteRef.current;
  if (!video) return;

  // iPhone & iPad Safari
  if (video.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
  }
  // Android Chrome and modern browsers
  else if (video.requestFullscreen) {
    video.requestFullscreen().catch(err => {
      console.error('Fullscreen failed:', err.message);
    });
  }
  // Older Firefox
  else if (video.mozRequestFullScreen) {
    video.mozRequestFullScreen();
  }
  // IE/Edge legacy
  else if (video.msRequestFullscreen) {
    video.msRequestFullscreen();
  } else {
    alert('Fullscreen not supported on this browser.');
  }
};


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">ScreenShare Live</h1>
      <p className="text-gray-400 mb-8">Peer-to-Peer Screen Sharing via PeerJS</p>

      {role === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-4">Presenter</h2>
            <button
              onClick={startPresenter}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Start Sharing
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-4">Viewer</h2>
            <button
              onClick={startViewer}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
            >
              Connect to Stream
            </button>
          </div>
        </div>
      ) : role === 'presenter' ? (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">You are sharing your screen</h2>
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto rounded border border-gray-600"
          />
          <button
            onClick={reset}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
          >
            Stop Sharing
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Watching Stream</h2>
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-auto rounded border border-gray-600"
          />
          <div className="mt-4 flex gap-4">
            <button
              onClick={reset}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
            >
              Disconnect
            </button>
            <button
              onClick={enterFullScreen}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
            >
              Full Screen
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 text-sm text-gray-500">
        Built with React • PeerJS • TailwindCSS
      </footer>
    </div>
  );
}
