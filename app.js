import React, { useState, useEffect } from "react";

const App = () => {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [journalEntry, setJournalEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("journal");
  const [showPrompt, setShowPrompt] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showInsights, setShowInsights] = useState(false);
  const [mood, setMood] = useState("");
  const [showMeditation, setShowMeditation] = useState(false);
  const [meditationTime, setMeditationTime] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Black and gold color palette
  const colors = {
    primary: "#D4AF37",
    secondary: "#B8860B",
    accent: "#F5DEB3",
    light: "#000000",
    dark: "#FFFFFF",
    text: "#FFFFFF",
    darkText: "#CCCCCC",
    border: "#333333"
  };

  // Shadow work prompts
  const shadowPrompts = [
    "What emotion do you avoid feeling, and why?",
    "Describe a recent situation where you felt triggered. What might this reveal about your shadow?",
    "What quality in others do you judge harshly? Could this be a projection of your own unacknowledged traits?",
    "Write about a childhood experience that still affects you today.",
    "What part of yourself do you hide from others? Why?",
    "Describe a recurring dream or nightmare. What might it symbolize?",
    "What would you do if you weren't afraid of judgment?",
    "Write a letter to your younger self with compassion and understanding.",
    "What aspects of yourself do you suppress to fit in?",
    "Describe a time you felt deeply ashamed. How can you offer yourself forgiveness?",
    "What are you avoiding acknowledging about yourself?",
    "What would you say to your shadow self if you could meet face to face?",
    "What patterns keep showing up in your relationships?",
    "What part of yourself needs healing right now?",
    "What would you do if you believed you were worthy?",
    "Describe a moment when you felt powerless. How can you reclaim that power?",
    "What are you afraid to admit to yourself?",
    "Write about a quality you dislike in yourself. How might it serve you?",
    "What would your life look like if you embraced all parts of yourself?",
    "What message does your body have for you today?"
  ];

  // Mood tracking options
  const moods = ["😊", "😌", "😐", "😔", "😢"];

  // Meditation guide
  const meditationGuide = [
    "Sit comfortably with your back straight",
    "Close your eyes and take three deep breaths",
    "Focus on the sensation of your breath",
    "When your mind wanders, gently bring it back",
    "Allow thoughts to come and go like clouds"
  ];

  // Admin email
  const ADMIN_EMAIL = "samadhidagreat@gmail.com";

  // Initialize Firebase
  useEffect(() => {
    try {
      // Check if Firebase is already initialized
      if (!firebase.apps.length) {
        const firebaseConfig = {
          apiKey: "AIzaSyAaKs6MpP-YogWOIFPyIxMN4xCNkuhAlBc",
          authDomain: "soul-mirror-80383.firebaseapp.com",
          projectId: "soul-mirror-80383",
          storageBucket: "soul-mirror-80383.firebasestorage.app",
          messagingSenderId: "494819290917",
          appId: "1:494819290917:web:bc1477cf87a345157274cc"
        };
        firebase.initializeApp(firebaseConfig);
      }
      setInitialized(true);
    } catch (err) {
      setError("Firebase initialization error: " + err.message);
    }
  }, []);

  // Check authentication state
  useEffect(() => {
    if (!initialized) return;
    
    let unsubscribe = null;
    
    try {
      unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          setCurrentUser(user);
          // Fetch user profile
          const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
          if (userDoc.exists) {
            setUserProfile(userDoc.data());
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      });
    } catch (err) {
      setError("Authentication error: " + err.message);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialized]);

  // Set up real-time listeners when user is authenticated
  useEffect(() => {
    if (!currentUser || !userProfile || !initialized) return;
    
    let unsubscribeEntries = null;
    let unsubscribeMessages = null;
    let unsubscribePending = null;
    let unsubscribeAllUsers = null;

    try {
      // Get today's prompt
      const today = new Date().toDateString();
      const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomIndex = seed % shadowPrompts.length;
      setCurrentPrompt(shadowPrompts[randomIndex]);

      // Set up real-time listener for journal entries
      unsubscribeEntries = firebase.firestore()
        .collection("entries")
        .where("userId", "==", currentUser.uid)
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {
          const entriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setEntries(entriesData);
        });

      // Set up real-time listener for chat messages
      unsubscribeMessages = firebase.firestore()
        .collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(messagesData);
        });

      // Admin panel listeners
      if (userProfile.role === 'admin') {
        unsubscribePending = firebase.firestore()
          .collection("pendingUsers")
          .onSnapshot((snapshot) => {
            const pendingData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setPendingUsers(pendingData);
          });

        unsubscribeAllUsers = firebase.firestore()
          .collection("users")
          .onSnapshot((snapshot) => {
            const allUsersData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAllUsers(allUsersData);
          });
      }

      return () => {
        if (unsubscribeEntries) unsubscribeEntries();
        if (unsubscribeMessages) unsubscribeMessages();
        if (unsubscribePending) unsubscribePending();
        if (unsubscribeAllUsers) unsubscribeAllUsers();
      };
    } catch (err) {
      setError("Listener setup error: " + err.message);
    }
  }, [currentUser, userProfile, initialized]);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await firebase.firestore().collection("users").doc(user.uid).set({
        name,
        email,
        role: email === ADMIN_EMAIL ? 'admin' : 'user',
        status: 'approved',
        joinDate: new Date().toISOString().split('T')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // If not admin email, add to pending users for admin approval
      if (email !== ADMIN_EMAIL) {
        await firebase.firestore().collection("pendingUsers").add({
          name,
          email,
          userId: user.uid,
          joinDate: new Date().toISOString().split('T')[0],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      setShowAuth(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Check if user is approved
      const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.status !== 'approved') {
          setError("Your account is pending approval by the administrator.");
          await firebase.auth().signOut();
        }
      } else {
        setError("User profile not found. Please contact administrator.");
        await firebase.auth().signOut();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSaveEntry = async () => {
    if (!journalEntry.trim() || !currentUser || !userProfile) {
      return;
    }

    setLoading(true);
    try {
      await firebase.firestore().collection("entries").add({
        userId: currentUser.uid,
        userName: userProfile.name,
        prompt: currentPrompt,
        entry: journalEntry,
        mood: mood,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setJournalEntry("");
      setMood("");
      setShowPrompt(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !userProfile) {
      return;
    }

    setLoading(true);
    try {
      await firebase.firestore().collection("messages").add({
        userId: currentUser.uid,
        userName: userProfile.name,
        message: newMessage,
        avatar: userProfile.avatar,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      setNewMessage("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPrompt = () => {
    if (currentUser) {
      const today = new Date().toDateString();
      const seed = (today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + Date.now()) % 1000;
      const randomIndex = seed % shadowPrompts.length;
      setCurrentPrompt(shadowPrompts[randomIndex]);
      setShowPrompt(true);
      setJournalEntry("");
      setMood("");
    }
  };

  const approveUser = async (pendingUserId, pendingUserData) => {
    try {
      // Update user status in users collection
      await firebase.firestore().collection("users").doc(pendingUserData.userId).update({
        status: 'approved'
      });

      // Remove from pending users
      await firebase.firestore().collection("pendingUsers").doc(pendingUserId).delete();

      alert(`${pendingUserData.name} has been approved!`);
    } catch (error) {
      setError(error.message);
    }
  };

  const denyUser = async (pendingUserId, pendingUserData) => {
    try {
      // Remove user from pending users
      await firebase.firestore().collection("pendingUsers").doc(pendingUserId).delete();
      alert(`${pendingUserData.name} has been denied.`);
    } catch (error) {
      setError(error.message);
    }
  };

  const isAdmin = userProfile && userProfile.email === ADMIN_EMAIL;

  // Meditation timer
  const [meditationActive, setMeditationActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(meditationTime * 60);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let interval = null;
    if (meditationActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setMeditationActive(false);
      setCurrentStep(0);
      alert("Meditation complete! Take a moment to notice how you feel.");
    }
    return () => clearInterval(interval);
  }, [meditationActive, timeLeft]);

  const startMeditation = () => {
    setMeditationActive(true);
    setTimeLeft(meditationTime * 60);
    setCurrentStep(0);
  };

  const pauseMeditation = () => {
    setMeditationActive(false);
  };

  const resetMeditation = () => {
    setMeditationActive(false);
    setTimeLeft(meditationTime * 60);
    setCurrentStep(0);
  };

  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🪞</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>Soul Mirror</h1>
          <p className="text-gray-400">Initializing application...</p>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="container mx-auto px-4 py-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: colors.primary, textShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }}>
                Soul Mirror
              </h1>
              <p className="text-sm opacity-80 text-gray-400">
                Reflect. Heal. Transform.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {!currentUser ? (
                <button
                  onClick={() => {
                    setShowAuth(true);
                    setAuthMode("login");
                    setError("");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full font-medium hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200"
                  style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)' }}
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={userProfile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                      alt={userProfile?.name || 'User'}
                      className="w-8 h-8 rounded-full border-2"
                      style={{ borderColor: colors.primary }}
                    />
                    <span className="font-medium text-gray-200">{userProfile?.name}</span>
                  </div>
                  
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
                    >
                      Admin
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm hover:bg-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Date and gold element */}
          {currentUser && (
            <div className="flex justify-center items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-black/70 px-4 py-2 rounded-full" style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 10px rgba(212, 175, 55, 0.2)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: colors.primary }}>
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-200">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="text-2xl">✨</div>
            </div>
          )}
        </div>
      </header>

      {!currentUser ? (
        /* Welcome Screen */
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <div className="text-center max-w-2xl">
            <div className="text-6xl mb-6">🪞</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.primary, textShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}>
              Welcome to Soul Mirror
            </h2>
            <p className="text-lg mb-8 text-gray-300 leading-relaxed">
              A sacred space for shadow work and self-discovery. Join our community to receive daily prompts, 
              journal your reflections, and connect with others on the path of inner transformation.
            </p>
            <button
              onClick={() => {
                setShowAuth(true);
                setAuthMode("login");
                setError("");
              }}
              className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full font-medium text-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 shadow-lg"
              style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
            >
              Begin Your Journey
            </button>
          </div>
        </div>
      ) : (
        /* Main App Content */
        <>
          {/* Navigation Tabs */}
          <div className="container mx-auto px-4 mb-6">
            <div className="flex bg-black/60 rounded-full p-1 max-w-md mx-auto" style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)' }}>
              <button
                onClick={() => setActiveTab("journal")}
                className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-200 ${
                  activeTab === "journal"
                    ? `bg-black text-yellow-400 shadow-lg`
                    : "text-gray-400 hover:text-gray-200"
                }`}
                style={activeTab === "journal" ? { boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' } : {}}
              >
                Journal
              </button>
              <button
                onClick={() => setActiveTab("community")}
                className={`flex-1 py-3 px-6 rounded-full font-medium transition-all duration-200 ${
                  activeTab === "community"
                    ? `bg-black text-yellow-400 shadow-lg`
                    : "text-gray-400 hover:text-gray-200"
                }`}
                style={activeTab === "community" ? { boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' } : {}}
              >
                Community
              </button>
            </div>
          </div>

          <div className="container mx-auto px-4 pb-8">
            {activeTab === "journal" ? (
              <div className="max-w-4xl mx-auto">
                {/* Current Prompt Card */}
                {showPrompt && (
                  <div 
                    className="bg-black/80 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm"
                    style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-black font-bold">💡</span>
                      </div>
                      <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>Today's Reflection</h2>
                    </div>
                    <p className="text-lg mb-6 leading-relaxed text-gray-200">
                      {currentPrompt}
                    </p>
                    
                    {/* Mood Tracker */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3" style={{ color: colors.primary }}>
                        How are you feeling today?
                      </label>
                      <div className="flex justify-center space-x-4">
                        {moods.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => setMood(emoji)}
                            className={`text-3xl p-2 rounded-full transition-all duration-200 ${
                              mood === emoji ? 'scale-125' : 'hover:scale-110'
                            }`}
                            style={{
                              backgroundColor: mood === emoji ? colors.primary : 'transparent',
                              border: mood === emoji ? '2px solid white' : 'none'
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleSaveEntry}
                        disabled={!journalEntry.trim() || loading}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full font-medium hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}
                      >
                        {loading ? 'Saving...' : 'Save Entry'}
                      </button>
                      <button
                        onClick={handleNewPrompt}
                        disabled={loading}
                        className="px-6 py-2 bg-transparent text-yellow-400 rounded-full font-medium hover:bg-yellow-900 transition-all duration-200 border border-yellow-600"
                      >
                        New Prompt
                      </button>
                      <button
                        onClick={() => setShowMeditation(true)}
                        disabled={loading}
                        className="px-6 py-2 bg-transparent text-yellow-400 rounded-full font-medium hover:bg-yellow-900 transition-all duration-200 border border-yellow-600"
                      >
                        Guided Meditation
                      </button>
                      <button
                        onClick={() => setShowInsights(true)}
                        disabled={loading}
                        className="px-6 py-2 bg-transparent text-yellow-400 rounded-full font-medium hover:bg-yellow-900 transition-all duration-200 border border-yellow-600"
                      >
                        My Insights
                      </button>
                    </div>
                  </div>
                )}

                {/* Journal Entry */}
                <div 
                  className="bg-black/80 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm"
                  style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                    {showPrompt ? "Your Reflection" : "Continue Writing"}
                  </h3>
                  <textarea
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    placeholder="Write your thoughts, feelings, and insights... Allow yourself to be honest and vulnerable. There are no right or wrong answers in shadow work."
                    className="w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-200 placeholder-gray-500 bg-black/50"
                    style={{ borderColor: colors.primary }}
                  />
                </div>

                {/* Previous Entries */}
                {entries.length > 0 && (
                  <div 
                    className="bg-black/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
                    style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
                  >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                      Your Journal History
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {entries.map((entry) => (
                        <div 
                          key={entry.id} 
                          className="p-4 rounded-lg border-l-4"
                          style={{ 
                            borderColor: colors.primary,
                            backgroundColor: 'rgba(212, 175, 55, 0.1)'
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-gray-200">
                              {entry.date} • {entry.time}
                            </p>
                            {entry.mood && (
                              <span className="text-2xl">{entry.mood}</span>
                            )}
                          </div>
                          <p className="text-sm italic mb-2" style={{ color: colors.primary }}>
                            "{entry.prompt}"
                          </p>
                          <p className="text-gray-200 leading-relaxed">{entry.entry}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Community Chat */}
                <div 
                  className="bg-black/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm mb-6"
                  style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-black font-bold">💬</span>
                    </div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>Community Circle</h2>
                  </div>
                  <p className="text-gray-400 mb-4 text-sm">
                    Share your journey, offer support, and connect with others on the path of inner transformation.
                  </p>
                  
                  {/* Chat Messages */}
                  <div 
                    className="bg-black/60 rounded-xl p-4 mb-4 h-80 overflow-y-auto"
                    style={{ border: `1px solid ${colors.primary}` }}
                  >
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={index} className="mb-3">
                          <div className="flex items-center mb-1">
                            <img
                              src={msg.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                              alt={msg.userName}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                            <span className="text-sm font-medium text-gray-200">{msg.userName}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : ''}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm ml-8 bg-black/80 rounded-lg p-2 inline-block" style={{ maxWidth: '80%' }}>
                            {msg.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Share your thoughts with the community..."
                      className="flex-1 p-3 border rounded-full focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-200 bg-black/50"
                      style={{ borderColor: colors.primary }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || loading}
                      className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full font-medium hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 disabled:opacity-50"
                      style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>

                {/* Community Guidelines */}
                <div 
                  className="bg-black/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
                  style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
                >
                  <h3 className="text-lg font-semibold mb-3" style={{ color: colors.primary }}>
                    Community Guidelines
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2 mt-1">✦</span>
                      Practice radical honesty with yourself and compassion with others
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2 mt-1">✦</span>
                      Respect confidentiality - what's shared here stays here
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2 mt-1">✦</span>
                      Offer support, not unsolicited advice
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2 mt-1">✦</span>
                      Remember that everyone's journey is unique and valid
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Authentication Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-black rounded-2xl p-8 max-w-md w-full"
            style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
                {authMode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-gray-400">
                {authMode === "login" 
                  ? "Sign in to continue your journey" 
                  : "Join our community of self-discovery"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white bg-black/50"
                    style={{ borderColor: colors.primary }}
                    placeholder="Enter your full name"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white bg-black/50"
                  style={{ borderColor: colors.primary }}
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.primary }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white bg-black/50"
                  style={{ borderColor: colors.primary }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={authMode === "login" ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg font-medium hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200 disabled:opacity-50"
                style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}
              >
                {loading ? (authMode === "login" ? 'Signing in...' : 'Creating account...') : (authMode === "login" ? 'Sign In' : 'Create Account')}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setError("");
                }}
                className="text-sm text-yellow-400 hover:text-yellow-300"
              >
                {authMode === "login" 
                  ? "Need an account? Register" 
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <button
              onClick={() => {
                setShowAuth(false);
                setError("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="bg-black rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                Admin Panel
              </h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Pending Users */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                Pending Approvals ({pendingUsers.length})
              </h3>
              {pendingUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending users</p>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{ borderColor: colors.primary }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-200">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500">Joined: {user.joinDate}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveUser(user.id, user)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {loading ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => denyUser(user.id, user)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {loading ? 'Denying...' : 'Deny'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Users */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                All Users ({allUsers.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    style={{ borderColor: colors.primary }}
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-200">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'approved' 
                          ? 'bg-green-800 text-green-200' 
                          : 'bg-yellow-800 text-yellow-200'
                      }`}>
                        {user.status}
                      </span>
                      {user.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-800 text-purple-200 rounded-full text-xs">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meditation Modal */}
      {showMeditation && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-black rounded-2xl p-6 max-w-2xl w-full"
            style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                Guided Meditation
              </h2>
              <button
                onClick={() => {
                  setShowMeditation(false);
                  setMeditationActive(false);
                  setCurrentStep(0);
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!meditationActive ? (
              <div className="text-center">
                <div className="text-6xl mb-6">🧘</div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
                  Prepare for Your Meditation
                </h3>
                <p className="text-gray-300 mb-6">
                  Take a moment to find a comfortable position. You can sit or lie down.
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: colors.primary }}>
                    Duration: {meditationTime} minutes
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={meditationTime}
                    onChange={(e) => setMeditationTime(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{ 
                      background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${((meditationTime-5)/25)*100}%, #333333 ${((meditationTime-5)/25)*100}%, #333333 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5 min</span>
                    <span>30 min</span>
                  </div>
                </div>

                <button
                  onClick={startMeditation}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-full font-medium hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200"
                  style={{ boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}
                >
                  Begin Meditation
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">⏱️</div>
                <div className="text-4xl font-mono mb-2" style={{ color: colors.primary }}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                
                <div className="mb-6 p-4 bg-black/50 rounded-lg" style={{ border: `1px solid ${colors.primary}` }}>
                  <p className="text-lg text-gray-200">
                    {meditationGuide[currentStep]}
                  </p>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={pauseMeditation}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-full font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Pause
                  </button>
                  <button
                    onClick={resetMeditation}
                    className="px-6 py-2 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {showInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="bg-black rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ border: `1px solid ${colors.primary}`, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                Your Insights
              </h2>
              <button
                onClick={() => setShowInsights(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Mood Trends */}
              <div 
                className="p-6 rounded-xl"
                style={{ border: `1px solid ${colors.primary}` }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                  Mood Trends
                </h3>
                <div className="space-y-3">
                  {entries.slice(0, 5).map((entry, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                    >
                      <span style={{ color: colors.darkText }}>{entry.date}</span>
                      <div className="flex items-center">
                        <span className="mr-2" style={{ color: colors.primary }}>Mood:</span>
                        <span className="text-2xl">{entry.mood || '😐'}</span>
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No entries yet to show mood trends</p>
                  )}
                </div>
              </div>

              {/* Journal Statistics */}
              <div 
                className="p-6 rounded-xl"
                style={{ border: `1px solid ${colors.primary}` }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                  Journal Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: colors.darkText }}>Total Entries:</span>
                    <span style={{ color: colors.primary }}>{entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.darkText }}>Words Written:</span>
                    <span style={{ color: colors.primary }}>
                      {entries.reduce((acc, entry) => acc + entry.entry.split(' ').length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.darkText }}>Days Journaling:</span>
                    <span style={{ color: colors.primary }}>
                      {new Set(entries.map(e => e.date)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.darkText }}>Longest Streak:</span>
                    <span style={{ color: colors.primary }}>7 days</span>
                  </div>
                </div>
              </div>

              {/* Recent Prompts */}
              <div 
                className="p-6 rounded-xl"
                style={{ border: `1px solid ${colors.primary}` }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                  Recent Prompts
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {entries.slice(0, 5).map((entry, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg text-sm"
                      style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                    >
                      <p style={{ color: colors.darkText }}>"{entry.prompt}"</p>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No entries yet</p>
                  )}
                </div>
              </div>

              {/* Reflections */}
              <div 
                className="p-6 rounded-xl"
                style={{ border: `1px solid ${colors.primary}` }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                  Your Growth
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    You've shown consistent commitment to your inner work. Each entry is a step toward greater self-awareness.
                  </p>
                  <p>
                    Notice how your responses to similar themes have evolved over time. This is the beautiful process of integration.
                  </p>
                  <p>
                    Remember to honor both your light and shadow - they are both essential parts of your wholeness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-900 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-start">
            <div>
              <strong>Error:</strong>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError("")}
              className="text-white ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>May your journey of self-discovery be illuminated with wisdom and grace ✨</p>
      </footer>
    </div>
  );
};

export default App;