'use client';

import { useState, useEffect, useRef } from 'react';

// ─── THEME ────────────────────────────────────────────────────
const C = {
  pink:    '#ef6c82',
  pinkD:   '#d95369',
  bg:      '#f8f7f5',
  yellow:  '#fef0b3',
  yellowD: '#d4a017',
  text:    '#1d1d1f',
  muted:   '#6e6e73',
  card:    '#ffffff',
};

const BG = `radial-gradient(circle at 15% 15%, rgba(254,240,179,0.4) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(239,108,130,0.2) 0%, transparent 45%)`;

// ─── CONSTANTS ────────────────────────────────────────────────
const INTERESTS_LIST = [
  'Travel','Photography','Music','Fitness','Reading','Hiking',
  'Yoga','Art','Movies','Animals','Wildlife','Environmental',
  'Sustainability','Eco-friendly','Green living','Recycling',
  'Volunteering','Charity','Community',
];
const ZODIAC_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        background: disabled || loading ? '#ccc' : C.pink,
        color: '#fff',
        fontWeight: 800,
        fontSize: '16px',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 20px rgba(239,108,130,0.35)',
        transition: 'transform 0.1s, background 0.2s',
        letterSpacing: '0.01em',
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

function OutlineBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '15px',
        borderRadius: '16px',
        background: '#fff',
        color: C.text,
        fontWeight: 700,
        fontSize: '15px',
        border: `2px solid rgba(0,0,0,0.12)`,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function PhoneInput({ label, value, onChange, placeholder, type = 'text', onEnter, note }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: '12px',
          border: `2px solid ${C.pink}`,
          fontSize: '17px',
          fontWeight: 600,
          color: C.text,
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      {note && <p style={{ fontSize: '12px', color: C.muted, marginTop: '6px' }}>{note}</p>}
    </div>
  );
}

function StdInput({ label, value, onChange, placeholder, type = 'text', note, sublabel }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>
          {label} {sublabel && <span style={{ fontWeight: 400, color: C.muted, fontSize: '11px' }}>{sublabel}</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '2px solid rgba(0,0,0,0.1)',
          fontSize: '14px',
          fontWeight: 500,
          color: C.text,
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
        onFocus={e => { e.target.style.borderColor = C.pink; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; }}
      />
      {note && <p style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>{note}</p>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.card,
      borderRadius: '18px',
      padding: '18px',
      marginBottom: '14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function IconBubble({ emoji }) {
  return (
    <div style={{
      width: '80px', height: '80px',
      borderRadius: '50%',
      border: `2px dashed ${C.yellowD}`,
      background: C.yellow,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '32px',
      margin: '0 auto 24px',
    }}>
      {emoji}
    </div>
  );
}

function Toast({ msg, type }) {
  const bg = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : C.text;
  return (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, padding: '12px 24px', borderRadius: '999px',
      background: bg, color: '#fff', fontWeight: 700, fontSize: '14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  );
}

function TimerBar({ value, max }) {
  return (
    <div style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden', marginTop: '10px' }}>
      <div style={{ height: '100%', width: `${Math.max(0, (value / max) * 100)}%`, background: C.pink, borderRadius: '999px', transition: 'width 1s linear' }} />
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState('phone');
  const [activeTab, setActiveTab] = useState('pears');
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [toast, setToast] = useState(null);

  // Auth
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [height, setHeight] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [instagram, setInstagram] = useState('');

  // Saved profile from DB
  const [userProfile, setUserProfile] = useState(null);

  // Event & matching
  const [genderPref, setGenderPref] = useState('equal');
  const [liveEvent, setLiveEvent] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [realMatches, setRealMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [preHuntTime, setPreHuntTime] = useState(15);
  const [chatMatch, setChatMatch] = useState(null);
  const [chatConvId, setChatConvId] = useState(null);
  const EVENT = liveEvent || { date: 'Loading...', venue: 'Loading...', attendees: registeredCount, round: currentRound, totalRounds: 6 };

  // Timers
  const [eventTime, setEventTime] = useState(30 * 60);
  const [roundTime, setRoundTime] = useState(45);
  const [nextMatchTime, setNextMatchTime] = useState(2 * 60 + 14);
  const timerRef = useRef(null);

  const showMsg = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const goTo = (s) => { setScreen(s); setError(''); };

  const logout = () => {
    localStorage.removeItem('peard_token');
    localStorage.removeItem('peard_user_id');
    localStorage.removeItem('peard_phone');
    setUser(null); setPhone(''); setOtpCode(''); setGender('');
    setDisplayName(''); setBirthday(''); setLocation('');
    goTo('phone');
  };

  useEffect(() => {
    const token = localStorage.getItem('peard_token');
    const userId = localStorage.getItem('peard_user_id');
    const savedPhone = localStorage.getItem('peard_phone');
    if (token && userId) {
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          if (r.status === 401) { logout(); return; }
          return r.json();
        })
        .then(data => {
          if (!data) return;
          // Restore user session
          setUser({ token, userId });
          if (savedPhone) setPhone(savedPhone);
          // Restore admin status
          const adminPhones = (process.env.NEXT_PUBLIC_ADMIN_PHONES || '').split(',').map(p => p.trim());
          if (savedPhone) setIsAdmin(adminPhones.includes(savedPhone));
          // Load profile data
          setUserProfile(data);
          if (data.first_name) setDisplayName(`${data.first_name} ${data.last_name || ''}`.trim());
          if (data.bio) setBio(data.bio);
          if (data.interests) setInterests(Array.isArray(data.interests) ? data.interests : JSON.parse(data.interests || '[]'));
          if (data.zodiac_sign) setZodiac(data.zodiac_sign);
          if (data.instagram_handle) setInstagram(data.instagram_handle);
          if (data.location_city) setLocation(data.location_city);
          if (data.gender) setGender(data.gender);
          // Go directly to event screen — skip all setup screens
          setScreen('event-ready');
        })
        .catch(() => { setUser({ token, userId }); setScreen('event-ready'); });
    }
  }, []);

  useEffect(() => {
    if (screen === 'event-ready' && user?.token) {
      fetch('/api/events', { headers: { Authorization: `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.events && data.events.length > 0) {
            const ev = data.events[0];
            let dateStr = 'Date TBA';
            try {
              const dateOnly = new Date(ev.date).toISOString().split('T')[0];
              const d = new Date(`${dateOnly}T${ev.startTime ? ev.startTime.substring(0,5) : '18:00'}:00`);
              dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } catch {}
            setLiveEvent({ id: ev.id, date: dateStr, venue: ev.location?.name || ev.location?.address || 'Venue TBA', attendees: ev.registered || ev.capacity || 0, round: 2, totalRounds: ev.numRounds || 6 });
            setEventId(ev.id);
            setRegisteredCount(ev.registered || 0);
          }
        })
        .catch(() => {});
    }
    if ((screen === 'waiting-lobby' || screen === 'event-timer') && user?.token && eventId) {
      fetchRegisteredCount(eventId);
      const interval = setInterval(() => fetchRegisteredCount(eventId), 10000);
      return () => clearInterval(interval);
    }
    if ((screen === 'hunt' || screen === 'pre-hunt') && user?.token) {
      const evId = eventId || liveEvent?.id;
      if (evId) { setEventId(evId); fetchMyMatch(evId, currentRound); }
    }
    if (screen === 'conversation' && user?.token && chatMatch) {
      // Try to find a mutual conversation with this partner
      fetch('/api/conversations', { headers: { Authorization: `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.conversations) {
            const conv = data.conversations.find(c => c.otherId === chatMatch.partnerId);
            if (conv) { setChatConvId(conv.id); fetchMessages(conv.id); }
          }
        })
        .catch(() => {});
    }
    if (screen === 'match-history' && user?.token) {
      fetchConversations();
      if (eventId) fetchRealMatches(eventId);
    }
    if (screen === 'optional-profile' && user?.token) {
      fetch('/api/users', { headers: { Authorization: `Bearer ${user.token}` } })
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            setUserProfile(data);
            if (data.first_name) setDisplayName(`${data.first_name} ${data.last_name || ''}`.trim());
            if (data.bio) setBio(data.bio);
            if (data.interests) setInterests(Array.isArray(data.interests) ? data.interests : JSON.parse(data.interests || '[]'));
            if (data.zodiac_sign) setZodiac(data.zodiac_sign);
            if (data.instagram_handle) setInstagram(data.instagram_handle);
            if (data.location_city) setLocation(data.location_city);
          }
        })
        .catch(() => {});
    }
  }, [screen, user]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (screen === 'waiting-lobby' || screen === 'event-timer') {
      timerRef.current = setInterval(() => {
        setEventTime(t => Math.max(0, t - 1));
        setNextMatchTime(t => Math.max(0, t - 1));
      }, 1000);
    }
    if (screen === 'pre-hunt') {
      setPreHuntTime(15);
      timerRef.current = setInterval(() => {
        setPreHuntTime(t => {
          if (t <= 1) { clearInterval(timerRef.current); setScreen('hunt'); return 15; }
          return t - 1;
        });
      }, 1000);
    }
    if (screen === 'conversation') {
      timerRef.current = setInterval(() => setRoundTime(t => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  // ── API ────────────────────────────────────────────────────
  const sendOTP = async () => {
    if (!phone) return setError('Please enter your phone number');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json();
      if (data.success) { if (data.demo_otp) setDemoOtp(data.demo_otp); goTo('otp'); }
      else setError(data.error || 'Failed to send OTP');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otpCode.length !== 6) return setError('Enter the 6-digit code');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, otp_code: otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('peard_token', data.access_token);
        localStorage.setItem('peard_user_id', data.user_id);
        localStorage.setItem('peard_phone', phone);
        setUser({ token: data.access_token, userId: data.user_id });
        const adminPhones = (process.env.NEXT_PUBLIC_ADMIN_PHONES || '').split(',').map(p => p.trim());
        setIsAdmin(adminPhones.includes(phone));
        showMsg('✅ Phone verified!', 'success');
        goTo('gender-select');
      } else setError(data.error || 'Invalid code');
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  const searchCity = async (query) => {
    setLocation(query);
    if (query.length < 2) { setLocationSuggestions([]); setShowLocationDropdown(false); return; }
    setLocationLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&featuretype=city&addressdetails=1`);
      const data = await res.json();
      const cities = data.map(item => {
        const a = item.address;
        const city = a.city || a.town || a.village || a.county || item.display_name.split(',')[0];
        const country = a.country || '';
        return { label: `${city}, ${country}`, lat: item.lat, lon: item.lon };
      }).filter((v, i, arr) => arr.findIndex(x => x.label === v.label) === i);
      setLocationSuggestions(cities);
      setShowLocationDropdown(cities.length > 0);
    } catch { setLocationSuggestions([]); }
    setLocationLoading(false);
  };

  const selectCity = (suggestion) => {
    setLocation(suggestion.label);
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
  };

  const saveBasicProfile = async () => {
    if (!displayName) return setError('Display name is required');
    if (!birthday) return setError('Birthday is required');
    if (!location) return setError('Location is required');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          first_name: displayName.split(' ')[0],
          last_name: displayName.split(' ').slice(1).join(' '),
          location_city: location.split(',')[0]?.trim(),
          location_country: location.split(',')[1]?.trim() || '',
          gender,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save profile'); setLoading(false); return; }
      showMsg('Profile saved!', 'success');
    } catch { setError('Network error. Please try again.'); setLoading(false); return; }
    goTo('optional-profile'); setLoading(false);
  };

  const saveOptionalProfile = async () => {
    setLoading(true);
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ bio, interests, height_cm: height ? parseInt(height) : undefined, zodiac_sign: zodiac, instagram_handle: instagram }),
      });
      showMsg('Profile complete!', 'success');
    } catch {}
    goTo('event-ready'); setLoading(false);
  };

  // ── REAL API FUNCTIONS ────────────────────────────────────

  const fetchRegisteredCount = async (evId) => {
    if (!evId) return;
    try {
      const res = await fetch(`/api/events`, { headers: { Authorization: `Bearer ${user?.token}` } });
      const data = await res.json();
      if (data.events) {
        const ev = data.events.find(e => e.id === evId);
        if (ev) setRegisteredCount(ev.registered || 0);
      }
    } catch {}
  };

  const joinEvent = async (evId) => {
    try {
      await fetch(`/api/events/${evId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ gender: gender || 'other', genderBalancePreference: 'equal' }),
      });
      setEventId(evId);
    } catch {}
  };

  const fetchMyMatch = async (evId, round) => {
    try {
      const res = await fetch(`/api/events/${evId}/rounds?round=${round}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.match) setCurrentMatch(data.match);
      else setCurrentMatch(null);
    } catch {}
  };

  const submitAction = async (action) => {
    if (!currentMatch?.id) return;
    const matchSnapshot = { ...currentMatch };
    try {
      const res = await fetch(`/api/matches/${currentMatch.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === 'like') {
        setChatMatch(matchSnapshot);
        setMessages([]);
        if (data.isMutual) {
          showMsg('🎉 It\'s a match!', 'success');
        }
        goTo('conversation');
      } else {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        if (eventId) fetchMyMatch(eventId, nextRound);
        goTo('pre-hunt');
      }
    } catch {}
  };

  const fetchRealMatches = async (evId) => {
    if (!evId) return;
    try {
      const res = await fetch(`/api/matches?eventId=${evId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.matches) setRealMatches(data.matches);
    } catch {}
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {}
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
  };

  const sendMessage = async () => {
    const convId = chatConvId || activeConv?.id;
    if (!chatInput.trim() || !convId) return;
    const content = chatInput.trim();
    setChatInput('');
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ content }),
      });
      fetchMessages(convId);
    } catch {}
  };

  const startRounds = async () => {
    if (!eventId) return showMsg('No event joined', 'error');
    try {
      const res = await fetch(`/api/events/${eventId}/rounds`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.success) { showMsg(`${data.message}`, 'success'); setCurrentRound(1); fetchMyMatch(eventId, 1); }
      else showMsg(data.error || 'Failed', 'error');
    } catch {}
  };

  const handlePhotoUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { const n = [...photos]; n[index] = e.target.result; setPhotos(n); };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (item) => {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : prev.length < 8 ? [...prev, item] : prev);
  };

  // ── SCREENS ───────────────────────────────────────────────
  const renderScreen = () => {
    switch (screen) {

      // ── 1. PHONE ────────────────────────────────────────────
      case 'phone': return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', background: C.bg, backgroundImage: BG }}>
          <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
              <span style={{ fontSize: '24px' }}>🍐</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>peard</span>
              <span style={{ fontSize: '12px', color: C.muted, marginLeft: '4px' }}>📍 Speed Dating Event</span>
            </div>
            <IconBubble emoji="📱" />
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: '8px' }}>Get Started</h1>
            <p style={{ color: C.muted, textAlign: 'center', marginBottom: '32px', fontSize: '15px' }}>Enter your phone number to continue</p>
            <PhoneInput label="Phone Number *" value={phone} onChange={setPhone} placeholder="+1234567890" type="tel" onEnter={sendOTP} note="We'll send you an OTP code to verify" />
            {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>{error}</p>}
            <PrimaryBtn onClick={sendOTP} loading={loading}>Send OTP Code</PrimaryBtn>
            <p style={{ textAlign: 'center', fontSize: '12px', color: C.muted, marginTop: '20px' }}>By continuing, you agree to our Terms & Conditions</p>
          </div>
        </div>
      );

      // ── 2. OTP ──────────────────────────────────────────────
      case 'otp': return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', background: C.bg, backgroundImage: BG }}>
          <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
              <span style={{ fontSize: '24px' }}>🍐</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>peard</span>
              <span style={{ fontSize: '12px', color: C.muted, marginLeft: '4px' }}>📍 Speed Dating Event</span>
            </div>
            <IconBubble emoji="❗" />
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: '8px' }}>Verify Your Phone</h1>
            <p style={{ color: C.muted, textAlign: 'center', marginBottom: '24px', fontSize: '15px' }}>We sent a code to {phone}</p>
            {demoOtp && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>Demo mode — your code is: <span style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '4px' }}>{demoOtp}</span></p>
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>Enter 6-Digit Code</label>
              <input
                type="number" value={otpCode}
                onChange={e => { setOtpCode(e.target.value.slice(0, 6)); setError(''); }}
                placeholder="123456" maxLength={6}
                onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `2px solid ${C.pink}`, fontSize: '32px', fontWeight: 900, textAlign: 'center', letterSpacing: '8px', color: C.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>
                <span style={{ color: C.muted }}>Didn't receive a code? </span>
                <button onClick={sendOTP} style={{ color: C.pink, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Resend</button>
              </p>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', fontWeight: 600, textAlign: 'center' }}>{error}</p>}
            <PrimaryBtn onClick={verifyOTP} loading={loading}>Verify &amp; Continue</PrimaryBtn>
            <button onClick={() => goTo('phone')} style={{ width: '100%', textAlign: 'center', color: C.muted, fontSize: '14px', fontWeight: 600, marginTop: '16px', padding: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
              Change Phone Number
            </button>
          </div>
        </div>
      );

      // ── 2b. GENDER SELECT ───────────────────────────────────
      case 'gender-select': return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px', background: C.bg, backgroundImage: BG }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>👤</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: C.text, marginBottom: '8px' }}>I am a...</h2>
            <p style={{ color: C.muted, fontSize: '14px', lineHeight: 1.5 }}>This helps us match you with the right people at events</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              { value: 'male', icon: '♂️', label: 'Man', color: '#4A90D9' },
              { value: 'female', icon: '♀️', label: 'Woman', color: C.pink },
              { value: 'nonbinary', icon: '⚧️', label: 'Non-binary', color: '#9B59B6' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setGender(opt.value)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderRadius: '16px', border: `2px solid ${gender === opt.value ? opt.color : 'rgba(0,0,0,0.1)'}`, background: gender === opt.value ? `${opt.color}10` : '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <span style={{ fontSize: '28px', width: '40px', textAlign: 'center' }}>{opt.icon}</span>
                <span style={{ fontSize: '17px', fontWeight: 700, color: gender === opt.value ? opt.color : C.text }}>{opt.label}</span>
                {gender === opt.value && <span style={{ marginLeft: 'auto', color: opt.color, fontSize: '20px', fontWeight: 900 }}>✓</span>}
              </button>
            ))}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>{error}</p>}
          <PrimaryBtn onClick={() => { if (!gender) return setError('Please select your gender'); setError(''); goTo('basic-profile'); }}>
            Continue →
          </PrimaryBtn>
        </div>
      );

      // ── 3. BASIC PROFILE ────────────────────────────────────
      case 'basic-profile': return (
        <div style={{ minHeight: '100vh', padding: '20px 20px 40px', background: C.bg, backgroundImage: BG }}>
          <div style={{ maxWidth: '380px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>🍐</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>peard</span>
              <div style={{ marginLeft: 'auto', background: '#22c55e', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px' }}>✅ Phone verified!</div>
            </div>
            <p style={{ fontSize: '12px', color: C.muted, marginBottom: '28px' }}>📍 Speed Dating Event</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: '4px' }}>Create Your Peard Profile</h2>
            <p style={{ fontSize: '14px', color: C.muted, textAlign: 'center', marginBottom: '24px' }}>Quick setup to find your match!</p>

            {/* Photo upload */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <button onClick={() => setShowPhotoModal(true)}
                style={{ width: '130px', height: '130px', borderRadius: '18px', border: `2px dashed ${C.pink}`, background: '#fef2f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                {photos[0]
                  ? <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (<><span style={{ fontSize: '28px', color: C.pink }}>📸</span><span style={{ fontSize: '12px', color: C.pink, fontWeight: 700, textAlign: 'center', lineHeight: '1.3' }}>Add Profile Pic<br/><span style={{ fontWeight: 400 }}>(Click to add photos)</span></span></>)
                }
              </button>
            </div>

            <StdInput label="Display Name *" value={displayName} onChange={setDisplayName} placeholder="Your name or nickname" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>Birthday * <span style={{ fontWeight: 400, fontSize: '11px', color: C.muted }}>(Cannot change)</span></label>
                <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = C.pink}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>Location *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={location} onChange={e => searchCity(e.target.value)} placeholder="Type your city..."
                    style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = C.pink; if (locationSuggestions.length > 0) setShowLocationDropdown(true); }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; setTimeout(() => setShowLocationDropdown(false), 200); }} />
                  {locationLoading && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#999' }}>searching...</div>}
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100, marginTop: '4px', overflow: 'hidden' }}>
                      {locationSuggestions.map((s, i) => (
                        <div key={i} onMouseDown={() => selectCity(s)}
                          style={{ padding: '10px 14px', fontSize: '13px', color: C.text, cursor: 'pointer', borderBottom: i < locationSuggestions.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                          onMouseEnter={e => e.target.style.background = '#fef0f2'}
                          onMouseLeave={e => e.target.style.background = '#fff'}>
                          📍 {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>{error}</p>}
            <PrimaryBtn onClick={saveBasicProfile} loading={loading}>Save</PrimaryBtn>
          </div>

          {/* Photo Modal */}
          {showPhotoModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>Your Photos</h3>
                  <button onClick={() => setShowPhotoModal(false)} style={{ fontSize: '20px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', width: '32px', height: '32px' }}>✕</button>
                </div>
                <p style={{ fontSize: '13px', color: C.muted, marginBottom: '16px' }}>Add up to 6 photos. Your first photo will be your profile picture.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {photos.map((photo, i) => (
                    <label key={i} style={{ aspectRatio: '1', borderRadius: '12px', border: '2px dashed rgba(0,0,0,0.15)', background: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                      {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (<><span style={{ fontSize: '20px', color: C.muted }}>📷</span><span style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Photo {i + 1}</span></>)}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(i, e.target.files[0])} />
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: C.muted, marginBottom: '16px' }}>💡 Tip: First photo will be your profile picture!</p>
                <PrimaryBtn onClick={() => setShowPhotoModal(false)}>Save Photos &amp; Return</PrimaryBtn>
              </div>
            </div>
          )}
        </div>
      );

      // ── 4. OPTIONAL PROFILE ─────────────────────────────────
      case 'optional-profile': return (
        <div style={{ minHeight: '100vh', padding: '24px 20px 60px', background: C.bg, backgroundImage: BG }}>
          <div style={{ maxWidth: '380px', margin: '0 auto' }}>

            {/* Profile Card */}
            {userProfile && (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 12px', color: '#fff', fontWeight: 900 }}>
                  {(userProfile.first_name || '?')[0].toUpperCase()}
                </div>
                <p style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{userProfile.first_name} {userProfile.last_name || ''}</p>
                <p style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>📍 {userProfile.location_city || 'No location set'}</p>
                <p style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>📱 {localStorage.getItem('peard_phone') || ''}</p>
                {userProfile.bio && <p style={{ fontSize: '13px', color: C.text, marginTop: '8px', fontStyle: 'italic' }}>"{userProfile.bio}"</p>}
              </div>
            )}

            <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: '4px' }}>Edit Your Profile</h2>
            <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', marginBottom: '24px' }}>Add more details to get more matches</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>About You (80 chars) *</label>
              <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 80))}
                placeholder="Designer, Photographer, Coffee lover..." rows={3}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '14px', color: C.text, background: '#fff', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = C.pink}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              <p style={{ fontSize: '12px', color: C.muted, textAlign: 'right', marginTop: '2px' }}>{bio.length}/80</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '10px' }}>Interests (Select up to 8)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {INTERESTS_LIST.map(item => (
                  <button key={item} onClick={() => toggleInterest(item)}
                    style={{ padding: '10px 12px', borderRadius: '12px', border: `2px solid ${interests.includes(item) ? C.pink : 'rgba(0,0,0,0.1)'}`, background: interests.includes(item) ? C.pink : '#fff', color: interests.includes(item) ? '#fff' : C.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                    {item}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: C.muted, marginTop: '6px' }}>{interests.length}/8 selected</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>Height</label>
                <input type="text" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 5'10&quot;"
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = C.pink} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>Zodiac Sign</label>
                <select value={zodiac} onChange={e => setZodiac(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                  <option value="">Select</option>
                  {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>Instagram Handle (Optional)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontWeight: 700, fontSize: '14px' }}>@</span>
                <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="username"
                  style={{ width: '100%', padding: '11px 14px 11px 32px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '13px', color: C.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = C.pink} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <OutlineBtn onClick={() => goTo('event-ready')}>Skip</OutlineBtn>
              <PrimaryBtn onClick={saveOptionalProfile} loading={loading}>Save &amp; Continue</PrimaryBtn>
            </div>

            <button onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) logout();
            }} style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '14px', border: '2px solid #fee2e2', background: '#fff5f5', color: '#ef4444', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
              🚪 Log Out
            </button>
          </div>
        </div>
      );

      // ── 5. EVENT READY ──────────────────────────────────────
      case 'event-ready': return (
        <div style={{ padding: '28px 20px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: '8px' }}>Event Ready!</h2>
          <p style={{ color: C.muted, textAlign: 'center', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>
            You're all set. Tap below to enter the event!
          </p>
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '28px' }}>
            {[
              { icon: '📅', label: 'DATE & TIME', value: EVENT.date },
              { icon: '📍', label: 'VENUE', value: EVENT.venue },
              { icon: '👥', label: 'ATTENDEES', value: `${EVENT.attendees} Singles` },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{row.icon}</div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row.label}</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: C.text, marginTop: '2px' }}>{row.value}</p>
                </div>
              </div>
            ))}
          </Card>
          <PrimaryBtn loading={loading} onClick={async () => {
            setLoading(true);
            if (liveEvent?.id) await joinEvent(liveEvent.id);
            setLoading(false);
            goTo('waiting-lobby');
          }}>
            🍐 Enter Event
          </PrimaryBtn>
        </div>
      );

      // ── 6. WAITING LOBBY ────────────────────────────────────
      case 'waiting-lobby': return (
        <div style={{ padding: '24px 20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: C.text, textAlign: 'center', marginBottom: '6px' }}>Welcome to Peard!</h2>
          <p style={{ color: C.muted, textAlign: 'center', fontSize: '14px', marginBottom: '20px' }}>You're checked in. Waiting for the hunt to start...</p>

          <Card>
            <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Event Time Remaining</p>
            <p style={{ fontSize: '52px', fontWeight: 900, color: C.pink, lineHeight: 1.1, marginBottom: '10px' }}>{formatTime(eventTime)}</p>
            <TimerBar value={eventTime} max={30 * 60} />
          </Card>

          <Card>
            <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Registered Attendees</p>
            <p style={{ fontSize: '44px', fontWeight: 900, color: C.text }}>{registeredCount || '...'}</p>
            <p style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>Updates every 10 seconds</p>
          </Card>

          <PrimaryBtn onClick={() => goTo('event-timer')}>Continue →</PrimaryBtn>
        </div>
      );

      // ── 7. EVENT TIMER ──────────────────────────────────────
      case 'event-timer': return (
        <div style={{ padding: '20px 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#22c55e', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '999px', marginBottom: '10px' }}>
            ✅ Equal Match Selected (14 Men = 14 Women)
          </div>
          <p style={{ color: C.muted, fontSize: '14px', marginBottom: '18px' }}>You're here! But you're already late! Join in the next round.</p>

          <Card>
            <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Event Time Remaining</p>
            <p style={{ fontSize: '52px', fontWeight: 900, color: C.pink, lineHeight: 1.1, marginBottom: '10px' }}>{formatTime(eventTime)}</p>
            <TimerBar value={eventTime} max={30 * 60} />
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Attendees Checked In</p>
                <p style={{ fontSize: '44px', fontWeight: 900, color: C.text }}>{registeredCount || '...'}</p>
              </div>
              <div style={{ marginLeft: 'auto', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
            </div>
          </Card>

          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
            <p style={{ fontWeight: 800, color: C.text, marginBottom: '4px' }}>⏰ Running Late?</p>
            <p style={{ fontSize: '13px', color: C.muted }}>No worries! Speed dating is already underway. You'll join in the next round.</p>
          </div>

          <Card style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Next match in</p>
            <p style={{ fontSize: '52px', fontWeight: 900, color: C.pink }}>{formatTime(nextMatchTime)}</p>
            <p style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>Current Round: {EVENT.round} of {EVENT.totalRounds}</p>
          </Card>

          <p style={{ textAlign: 'center', color: C.muted, fontSize: '14px', marginBottom: '16px' }}>⏳ Waiting for next round...</p>
          <PrimaryBtn onClick={() => { setCurrentRound(1); if (eventId) fetchMyMatch(eventId, 1); goTo('pre-hunt'); }}>Join Next Round →</PrimaryBtn>
        </div>
      );

      // ── 7b. PRE-HUNT TIMER ──────────────────────────────────
      case 'pre-hunt': return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.pink, color: '#fff', fontSize: '13px', fontWeight: 800, padding: '6px 18px', borderRadius: '999px', marginBottom: '24px' }}>
            Round {currentRound} of {EVENT.totalRounds}
          </div>

          {/* Partner preview — blurred avatar */}
          {currentMatch ? (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.pink}`, boxShadow: '0 4px 20px rgba(239,108,130,0.3)', filter: 'blur(6px)', transform: 'scale(1.05)' }}>
                {currentMatch.partnerPhoto
                  ? <img src={currentMatch.partnerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', color: '#fff', fontWeight: 900 }}>{currentMatch.partnerName?.[0]?.toUpperCase() || '?'}</div>
                }
              </div>
              <p style={{ fontSize: '16px', fontWeight: 900, color: C.text }}>
                Find <span style={{ color: C.pink }}>{currentMatch.partnerName?.split(' ')[0] || 'your match'}</span> in the room!
              </p>
              {currentMatch.partnerLocation && (
                <p style={{ fontSize: '12px', color: C.muted }}>📍 {currentMatch.partnerLocation}</p>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>🍐</div>
          )}

          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '24px' }}>Photo reveals when timer ends...</p>

          {/* Big countdown */}
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 40px rgba(239,108,130,0.4)`, marginBottom: '24px' }}>
            <span style={{ fontSize: '64px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{preHuntTime}</span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '200px', height: '6px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ height: '100%', width: `${((15 - preHuntTime) / 15) * 100}%`, background: C.pink, borderRadius: '999px', transition: 'width 1s linear' }} />
          </div>

          <p style={{ fontSize: '13px', color: C.muted }}>💡 Start looking around the room!</p>
        </div>
      );

      // ── 8. HUNT (FIND THE PEAR) ─────────────────────────────
      case 'hunt': return (
        <div style={{ padding: '16px 20px 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.pink, color: '#fff', fontSize: '13px', fontWeight: 800, padding: '6px 18px', borderRadius: '999px', marginBottom: '10px' }}>
              Round {currentRound} of {EVENT.totalRounds}
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: C.text, marginBottom: '2px' }}>Find the Pear 🍐</h2>
            <p style={{ fontSize: '13px', color: C.muted }}>Find this person in the room!</p>
          </div>

          {currentMatch ? (
            <>
              {/* Full Partner Card */}
              <div style={{ background: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginBottom: '16px', position: 'relative' }}>
                {/* Photo area */}
                <div style={{ width: '100%', height: '300px', background: `linear-gradient(135deg, #fef0f2, #fde8ec)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {currentMatch.partnerPhoto
                    ? <img src={currentMatch.partnerPhoto} alt={currentMatch.partnerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', color: '#fff', fontWeight: 900, boxShadow: '0 4px 20px rgba(239,108,130,0.4)' }}>
                          {currentMatch.partnerName?.[0]?.toUpperCase() || '🍐'}
                        </div>
                      </div>
                    )
                  }
                  {/* Gradient overlay at bottom */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)' }} />
                </div>

                {/* Partner info */}
                <div style={{ padding: '14px 20px 18px' }}>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: C.text, marginBottom: '4px' }}>{currentMatch.partnerName || 'Your Match'}</p>
                  {currentMatch.partnerLocation && (
                    <p style={{ fontSize: '13px', color: C.muted, marginBottom: '8px' }}>📍 {currentMatch.partnerLocation}</p>
                  )}
                  {currentMatch.partnerBio && (
                    <div style={{ background: '#fef2f4', borderRadius: '12px', padding: '10px 14px' }}>
                      <p style={{ fontSize: '13px', color: C.text, fontStyle: 'italic', lineHeight: 1.5 }}>"{currentMatch.partnerBio}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Skip */}
                <button onClick={() => { const next = currentRound + 1; setCurrentRound(next); if (eventId) fetchMyMatch(eventId, next); goTo('pre-hunt'); }}
                  style={{ padding: '18px 12px', borderRadius: '20px', border: '2px solid rgba(0,0,0,0.12)', background: '#fff', color: C.muted, fontSize: '15px', cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⏭</span> Skip
                </button>
                {/* Found Them */}
                <button onClick={() => submitAction('like')}
                  style={{ padding: '18px 12px', borderRadius: '20px', border: 'none', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, color: '#fff', fontSize: '15px', cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(239,108,130,0.4)' }}>
                  <span style={{ fontSize: '20px' }}>🍐</span> Found Them!
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <p style={{ fontWeight: 800, fontSize: '22px', color: C.text, marginBottom: '8px' }}>All rounds complete!</p>
              <p style={{ fontSize: '14px', color: C.muted, marginBottom: '28px' }}>Time to see who you matched with!</p>
              <PrimaryBtn onClick={() => { fetchConversations(); fetchRealMatches(eventId); goTo('match-history'); }}>View My Matches →</PrimaryBtn>
            </div>
          )}
        </div>
      );

      // ── 9. CONVERSATION (CHAT) ──────────────────────────────
      case 'conversation': {
        const partner = chatMatch;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', padding: '0' }}>
            {/* Chat header */}
            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                {partner?.partnerPhoto
                  ? <img src={partner.partnerPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (partner?.partnerName?.[0]?.toUpperCase() || '🍐')}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 900, fontSize: '16px', color: C.text, lineHeight: 1.2 }}>{partner?.partnerName || 'Your Match'}</p>
                {partner?.partnerLocation && <p style={{ fontSize: '12px', color: C.muted }}>📍 {partner.partnerLocation}</p>}
              </div>
              <div style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '999px' }}>❤️ Found!</div>
            </div>

            {/* Match celebration banner */}
            <div style={{ background: `linear-gradient(135deg, ${C.pink}15, ${C.yellow}30)`, padding: '14px 20px', borderBottom: '1px solid rgba(239,108,130,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginBottom: '2px' }}>🎉 You found each other!</p>
              <p style={{ fontSize: '12px', color: C.muted }}>Chat here or keep talking in person</p>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', background: C.bg }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>👋</div>
                  <p style={{ fontSize: '14px', color: C.muted, fontWeight: 600 }}>Say hi to {partner?.partnerName?.split(' ')[0] || 'your match'}!</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isOwn ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: msg.isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.isOwn ? `linear-gradient(135deg, ${C.pink}, ${C.pinkD})` : '#fff', color: msg.isOwn ? '#fff' : C.text, fontSize: '14px', fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input + Next Round */}
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder={chatConvId ? `Message ${partner?.partnerName?.split(' ')[0] || 'them'}...` : 'Chat unlocks on mutual match...'}
                  disabled={!chatConvId}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: '14px', border: `2px solid rgba(0,0,0,0.1)`, fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: chatConvId ? '#f9f9f9' : '#f3f3f3' }}
                  onFocus={e => { if (chatConvId) e.target.style.borderColor = C.pink; }}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
                <button onClick={sendMessage} disabled={!chatConvId}
                  style={{ padding: '11px 16px', borderRadius: '14px', background: chatConvId ? C.pink : '#ddd', color: '#fff', border: 'none', fontSize: '18px', cursor: chatConvId ? 'pointer' : 'not-allowed' }}>➤</button>
              </div>
              <button onClick={() => { const next = currentRound + 1; setCurrentRound(next); if (eventId) fetchMyMatch(eventId, next); setChatMatch(null); setChatConvId(null); setMessages([]); goTo('pre-hunt'); }}
                style={{ width: '100%', padding: '13px', borderRadius: '14px', border: '2px solid rgba(0,0,0,0.1)', background: '#fff', color: C.text, fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Next Round →
              </button>
            </div>
          </div>
        );
      }

      // ── 11. EVENT SUMMARY ───────────────────────────────────
      case 'event-summary': return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '30px', fontWeight: 900, color: C.text, marginBottom: '8px' }}>Event Complete!</h2>
          <p style={{ color: C.muted, fontSize: '15px', marginBottom: '28px' }}>You completed {EVENT.totalRounds} rounds tonight!</p>
          <Card style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '52px', fontWeight: 900, color: C.pink }}>{EVENT.totalRounds}</p>
            <p style={{ fontSize: '13px', color: C.muted }}>Rounds Completed</p>
          </Card>
          <Card style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '52px', fontWeight: 900, color: C.text }}>{EVENT.attendees}</p>
            <p style={{ fontSize: '13px', color: C.muted }}>People You Met</p>
          </Card>
          <div style={{ width: '100%', marginTop: '8px' }}>
            <PrimaryBtn onClick={() => goTo('match-history')}>View My Matches →</PrimaryBtn>
          </div>
        </div>
      );

      // ── 12. MATCH HISTORY ───────────────────────────────────
      case 'match-history': return (
        <div style={{ padding: '24px 20px' }}>
          {activeConv ? (
            // ── CHAT VIEW ──
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button onClick={() => setActiveConv(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>←</button>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '16px' }}>
                  {activeConv.otherName?.[0] || '?'}
                </div>
                <p style={{ fontWeight: 800, fontSize: '16px', color: C.text }}>{activeConv.otherName}</p>
              </div>
              <div style={{ height: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', padding: '4px 0' }}>
                {messages.length === 0 && <p style={{ textAlign: 'center', color: C.muted, fontSize: '14px', marginTop: '40px' }}>No messages yet. Say hi! 👋</p>}
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isOwn ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: msg.isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.isOwn ? C.pink : '#fff', color: msg.isOwn ? '#fff' : C.text, fontSize: '14px', fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..." style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = C.pink}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
                <button onClick={sendMessage} style={{ padding: '12px 18px', borderRadius: '14px', background: C.pink, color: '#fff', border: 'none', fontSize: '18px', cursor: 'pointer' }}>➤</button>
              </div>
            </>
          ) : (
            // ── MATCHES LIST ──
            <>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: C.text, marginBottom: '4px' }}>Match History 🍐</h2>
              <p style={{ color: C.muted, fontSize: '14px', marginBottom: '20px' }}>Your speed dating results</p>

              {/* Mutual matches / conversations */}
              {conversations.length > 0 && (
                <>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>💬 Your Matches</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {conversations.map(conv => (
                      <div key={conv.id} onClick={() => { setActiveConv(conv); fetchMessages(conv.id); }}
                        style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.pink}, ${C.pinkD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#fff', fontWeight: 900, flexShrink: 0 }}>
                          {conv.otherName?.[0] || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 800, color: C.text, fontSize: '15px' }}>{conv.otherName}</p>
                          <p style={{ fontSize: '12px', color: C.muted }}>{conv.lastMessage || 'Tap to say hi!'}</p>
                        </div>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px' }}>❤️ Match</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* All rounds */}
              {realMatches.length > 0 && (
                <>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>All Rounds</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {realMatches.map(m => (
                      <div key={m.id} style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, fontWeight: 900, color: C.pink }}>
                          {m.partnerName?.[0] || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 800, color: C.text, fontSize: '15px' }}>{m.partnerName || 'Round ' + m.roundNumber}</p>
                          <p style={{ fontSize: '12px', color: C.muted }}>Round {m.roundNumber}</p>
                        </div>
                        {m.isMutual && <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px' }}>❤️ Match!</span>}
                        {!m.isMutual && m.userAction === 'like' && <span style={{ background: '#fefce8', color: '#a16207', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px' }}>⏳ Pending</span>}
                        {m.userAction === 'pass' && <span style={{ background: '#f9fafb', color: '#6b7280', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px' }}>✕ Passed</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {realMatches.length === 0 && conversations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>🍐</div>
                  <p style={{ fontWeight: 700, color: C.text, marginBottom: '4px' }}>No matches yet</p>
                  <p style={{ fontSize: '13px', color: C.muted }}>Join an event to start meeting people!</p>
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <OutlineBtn onClick={() => goTo('event-ready')}>Back to Events</OutlineBtn>
              </div>
            </>
          )}
        </div>
      );

      default: return null;
    }
  };

  // ── LAYOUT ────────────────────────────────────────────────
  const isAuthScreen = screen === 'phone' || screen === 'otp' || screen === 'gender-select';
  const isSetupScreen = screen === 'basic-profile' || screen === 'optional-profile';
  const showHeader = !isAuthScreen;
  const showNav = !isAuthScreen && !isSetupScreen;

  const NAV_TABS = [
    { id: 'events',    icon: '📅', label: 'Events',   goto: 'event-ready' },
    { id: 'location',  icon: '📍', label: 'Location', goto: 'event-ready' },
    { id: 'pears',     icon: '❤️', label: 'Pears',    goto: 'hunt' },
    { id: 'messages',  icon: '💬', label: 'Messages', goto: 'match-history' },
    { id: 'profile',   icon: '👤', label: 'Profile',  goto: 'optional-profile' },
  ];

  const DEMO_ITEMS = [
    { section: 'SIGNUP FLOW', items: [['1. Phone','phone'],['2. OTP','otp'],['3. Basic Profile','basic-profile'],['4. Optional Details','optional-profile']] },
    { section: 'PRE-EVENT',   items: [['5. Event Details','event-ready']] },
    { section: 'EVENT FLOW',  items: [['6. Waiting Lobby','waiting-lobby'],['7. Event Timer (30m)','event-timer'],['7b. Pre-Hunt Timer (15s)','pre-hunt'],['8. Find the Pear','hunt'],['9. Chat Screen','conversation'],['11. Event Summary','event-summary'],['12. Match History','match-history']] },
  ];

  const AdminPanel = () => (
    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}>
      <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Admin Actions</p>
      <button onClick={() => { startRounds(); setShowDemoPanel(false); }}
        style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '10px', background: C.pink, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', marginBottom: '6px' }}>
        🚀 Start Rounds (Pair All Users)
      </button>
      <button onClick={() => { if (eventId) fetchMyMatch(eventId, currentRound); setShowDemoPanel(false); }}
        style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '10px', background: '#fff', color: C.text, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
        🔄 Refresh My Match
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, backgroundImage: BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && <Toast {...toast} />}

      {/* Demo Panel */}
      {showDemoPanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9998, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '70px 16px 0' }}
          onClick={() => setShowDemoPanel(false)}>
          <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', width: '210px', maxHeight: '75vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontWeight: 900, fontSize: '14px', color: C.text }}>Demo Jump Controls</p>
              <button onClick={() => setShowDemoPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: C.muted }}>✕</button>
            </div>
            {DEMO_ITEMS.map(({ section, items }) => (
              <div key={section}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '10px 0 4px' }}>{section}</p>
                {items.map(([label, s]) => (
                  <button key={s} onClick={() => { goTo(s); setShowDemoPanel(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: C.text, fontFamily: 'inherit', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f4'; e.currentTarget.style.color = C.pink; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text; }}>
                    {label}
                  </button>
                ))}
              </div>
            ))}
            <AdminPanel />
          </div>
        </div>
      )}

      <div style={{ maxWidth: '440px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        {showHeader && (
          <header style={{ position: 'sticky', top: 0, background: 'rgba(248,247,245,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 20px', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🍐</span>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 900, color: C.text, lineHeight: 1 }}>peard</p>
                  <p style={{ fontSize: '10px', color: C.muted }}>
                    {userProfile?.first_name ? `👋 Hey, ${userProfile.first_name}!` : '📍 Speed Dating Event'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { icon: '🔔', action: () => showMsg('No new notifications', 'info') },
                  { icon: '📤', action: () => { navigator.clipboard?.writeText(window.location.href); showMsg('Link copied!', 'success'); } },
                  ...(isAdmin ? [{ icon: '☰', action: () => setShowDemoPanel(true) }] : []),
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', background: i === 1 ? C.text : '#fff', border: i !== 1 ? '1px solid rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', color: i === 1 ? '#fff' : C.muted }}>
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main style={{ flex: 1, paddingBottom: showNav ? '72px' : 0 }}>
          {renderScreen()}
        </main>

        {/* Bottom Nav */}
        {showNav && (
          <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', zIndex: 100 }}>
            <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
              {NAV_TABS.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); goTo(tab.goto); }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab.id ? C.pink : C.muted, fontWeight: 700, fontSize: '11px', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
