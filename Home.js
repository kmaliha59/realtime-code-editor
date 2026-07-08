import './Home.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Users, Zap, Globe, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Home = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) {
      toast.error('Please enter your name');
      return;
    }
    try {
      const response = await axios.post('/api/rooms');
      const { roomId } = response.data;
      navigate(`/room/${roomId}?username=${encodeURIComponent(username)}`);
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const joinRoom = () => {
    const roomId = prompt('Enter room ID:');
    if (roomId && username.trim()) {
      navigate(`/room/${roomId}?username=${encodeURIComponent(username)}`);
    } else if (!username.trim()) {
      toast.error('Please enter your name first');
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="logo">
          <Code2 size={48} color="#60a5fa" />
          <h1>CodeSync</h1>
        </div>
        <p className="tagline">Real-time collaborative code editor</p>

        <div className="features">
          <div className="feature">
            <Users size={24} />
            <span>Live Collaboration</span>
          </div>
          <div className="feature">
            <Zap size={24} />
            <span>Instant Sync</span>
          </div>
          <div className="feature">
            <Globe size={24} />
            <span>30+ Languages</span>
          </div>
        </div>

        <div className="join-section">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="name-input"
          />
          <div className="button-group">
            <button onClick={createRoom} className="btn-primary">
              Create Room <ArrowRight size={18} />
            </button>
            <button onClick={joinRoom} className="btn-secondary">
              Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
