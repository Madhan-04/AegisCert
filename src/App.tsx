import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, User, initializeDbConnection } from './services/db';

// Import Pages
import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Import Dashboard Core Pages
import AdminDashboard from './pages/AdminDashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import StudentDashboard from './pages/StudentDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import CertificateIssuance from './pages/CertificateIssuance';
import CertificateVerification from './pages/CertificateVerification';
import QrScanner from './pages/QrScanner';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import AuditLogs from './pages/AuditLogs';
import Support from './pages/Support';

// Import New Security & Enterprise Pages
import SocDashboard from './pages/SocDashboard';
import FraudDashboard from './pages/FraudDashboard';
import BlockchainExplorer from './pages/BlockchainExplorer';
import RevocationCenter from './pages/RevocationCenter';
import FingerprintManagement from './pages/FingerprintManagement';
import CredentialWallet from './pages/CredentialWallet';
import OfflineVerification from './pages/OfflineVerification';
import AuditExplorer from './pages/AuditExplorer';
import SecurityControls from './pages/SecurityControls';
import MissionControl from './pages/MissionControl';
import AegisCopilot from './pages/AegisCopilot';
import TrustGraph from './pages/TrustGraph';

// New Enterprise Expansion v6 Pages
import AcademicFederation from './pages/AcademicFederation';
import InstitutionManager from './pages/InstitutionManager';
import InstitutionProfile from './pages/InstitutionProfile';
import ApiGateway from './pages/ApiGateway';
import DeveloperPortal from './pages/DeveloperPortal';
import ApiAnalytics from './pages/ApiAnalytics';
import DocumentIntelligence from './pages/DocumentIntelligence';
import DocumentScanner from './pages/DocumentScanner';
import AiAnalysisResults from './pages/AiAnalysisResults';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import InstitutionAnalytics from './pages/InstitutionAnalytics';
import ExecutiveReports from './pages/ExecutiveReports';
import BackupCenter from './pages/BackupCenter';
import RecoveryManager from './pages/RecoveryManager';
import BackupHistory from './pages/BackupHistory';
import PWASettings from './pages/PWASettings';
import NotificationCenter from './pages/NotificationCenter';
import OfflineManager from './pages/OfflineManager';

// Support Center components
import AegisAssistPanel from './components/AegisAssistPanel';
import AegisAssistManager from './pages/AegisAssistManager';

// Layout
import DashboardLayout from './components/DashboardLayout';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const location = useLocation();
  const rNavigate = useNavigate();
  
  // Extract base route (e.g. /verification?id=CERT-2810 -> verification)
  const pathname = location.pathname.substring(1) || 'landing';
  const currentRoute = pathname.includes('?') ? pathname.split('?')[0] : pathname;

  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60);

  useEffect(() => {
    // Start backend connection sync
    initializeDbConnection().then(() => {
      // Check session login state
      const user = db.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  const navigate = (route: string) => {
    const cleanRoute = route.replace('#', '');
    if (cleanRoute.startsWith('/')) {
      rNavigate(cleanRoute);
    } else {
      rNavigate('/' + cleanRoute);
    }
  };

  const handleLoginSuccess = (user: User) => {
    db.setCurrentUser(user);
    setCurrentUser(user);
    
    // Redirect to respective dashboard
    if (user.role === 'admin') {
      navigate('admin-dashboard');
    } else if (user.role === 'institution') {
      navigate('institution-dashboard');
    } else if (user.role === 'student') {
      navigate('student-dashboard');
    } else {
      navigate('verifier-dashboard');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      db.addAuditLog(currentUser.id, currentUser.name, currentUser.role, 'USER_LOGOUT', 'Logged out of system session', 'success');
    }
    db.setCurrentUser(null);
    setCurrentUser(null);
    navigate('landing');
  };

  // Inactivity timeout monitor: 15 mins total
  useEffect(() => {
    if (!currentUser) {
      setShowSessionWarning(false);
      return;
    }

    // Set initial activity time
    sessionStorage.setItem('csv_last_activity', Date.now().toString());

    const updateActivity = () => {
      sessionStorage.setItem('csv_last_activity', Date.now().toString());
      if (showSessionWarning) {
        setShowSessionWarning(false);
      }
    };

    // Track user movements
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    const interval = setInterval(() => {
      const last = sessionStorage.getItem('csv_last_activity');
      if (last) {
        const inactiveTime = Date.now() - parseInt(last, 10);
        const warnThreshold = 14 * 60 * 1000; // 14 minutes
        const maxThreshold = 15 * 60 * 1000;  // 15 minutes

        if (inactiveTime >= maxThreshold) {
          clearInterval(interval);
          setShowSessionWarning(false);
          db.addSocEvent('medium', 'SESSION_TIMEOUT_EXPIRED', `User session automatically terminated due to 15-minute inactivity timeout for ${currentUser.name}`, '127.0.0.1');
          handleLogout();
        } else if (inactiveTime >= warnThreshold) {
          setShowSessionWarning(true);
          const secondsRemaining = Math.max(0, Math.floor((maxThreshold - inactiveTime) / 1000));
          setSessionTimeLeft(secondsRemaining);
        } else {
          if (showSessionWarning) {
            setShowSessionWarning(false);
          }
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [currentUser, showSessionWarning]);

  const handleRoleSwitch = (newUser: User) => {
    db.setCurrentUser(newUser);
    setCurrentUser(newUser);
    
    // Redirect to matching role page
    if (newUser.role === 'admin') {
      navigate('admin-dashboard');
    } else if (newUser.role === 'institution') {
      navigate('institution-dashboard');
    } else if (newUser.role === 'student') {
      navigate('student-dashboard');
    } else {
      navigate('verifier-dashboard');
    }

    db.addAuditLog('dev-console', 'System Debugger', 'admin', 'ROLE_SWITCHED_SIM', `Switched active session user to "${newUser.name}" (${newUser.role})`, 'success');
  };

  // List of public pages
  const publicPages = ['landing', 'about', 'features', 'login', 'register', 'forgot-password'];
  const isPublicRoute = publicPages.includes(currentRoute);

  // Authorization guards
  useEffect(() => {
    if (!currentUser && !isPublicRoute) {
      // If not logged in and trying to access dashboard page, go to login
      // Exception: verification page is public!
      if (currentRoute !== 'verification') {
        navigate('login');
      }
    } else if (currentUser && isPublicRoute) {
      // If logged in and trying to access public auth pages (login/register)
      if (['login', 'register', 'forgot-password'].includes(currentRoute)) {
        if (currentUser.role === 'admin') navigate('admin-dashboard');
        else if (currentUser.role === 'institution') navigate('institution-dashboard');
        else if (currentUser.role === 'student') navigate('student-dashboard');
        else navigate('verifier-dashboard');
      }
    }
  }, [currentUser, currentRoute]);

  // Page renderer helper
  const renderPage = () => {
    switch (currentRoute) {
      // Public pages
      case 'landing':
        return <Landing navigate={navigate} />;
      case 'about':
        return <About navigate={navigate} />;
      case 'features':
        return <Features navigate={navigate} />;
      case 'login':
        return <Login navigate={navigate} onLoginSuccess={handleLoginSuccess} />;
      case 'register':
        return <Register navigate={navigate} />;
      case 'forgot-password':
        return <ForgotPassword navigate={navigate} />;
      
      // Dashboard Pages
      case 'admin-dashboard':
        return <AdminDashboard navigate={navigate} />;
      case 'institution-dashboard':
        return <InstitutionDashboard navigate={navigate} />;
      case 'student-dashboard':
        return <StudentDashboard navigate={navigate} />;
      case 'verifier-dashboard':
        return <VerifierDashboard navigate={navigate} />;
      case 'issuance':
        return <CertificateIssuance navigate={navigate} />;
      case 'verification':
        return <CertificateVerification />;
      case 'qr-scanner':
        return <QrScanner navigate={navigate} />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <UserProfile />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'support':
        return <Support />;
      
      // New Enterprise Pages
      case 'soc-dashboard':
        return <SocDashboard />;
      case 'fraud-dashboard':
        return <FraudDashboard />;
      case 'blockchain-explorer':
        return <BlockchainExplorer />;
      case 'revocation-center':
        return <RevocationCenter />;
      case 'fingerprint-management':
        return <FingerprintManagement navigate={navigate} />;
      case 'wallet':
        return <CredentialWallet />;
      case 'offline-verification':
        return <OfflineVerification />;
      case 'audit-explorer':
        return <AuditExplorer />;
      case 'security-controls':
        return <SecurityControls navigate={navigate} />;
      case 'mission-control':
        return <MissionControl />;
      case 'copilot':
        return <AegisCopilot />;
      case 'trust-graph':
        return <TrustGraph />;

      // New Enterprise Expansion v6 Pages
      case 'academic-federation':
        return <AcademicFederation />;
      case 'institution-manager':
        return <InstitutionManager />;
      case 'institution-profile':
        return <InstitutionProfile />;
      case 'api-gateway':
        return <ApiGateway />;
      case 'developer-portal':
        return <DeveloperPortal />;
      case 'api-analytics':
        return <ApiAnalytics />;
      case 'document-intelligence':
        return <DocumentIntelligence navigate={navigate} />;
      case 'document-scanner':
        return <DocumentScanner navigate={navigate} />;
      case 'ai-analysis-results':
        return <AiAnalysisResults />;
      case 'executive-dashboard':
        return <ExecutiveDashboard />;
      case 'institution-analytics':
        return <InstitutionAnalytics />;
      case 'executive-reports':
        return <ExecutiveReports />;
      case 'backup-center':
        return <BackupCenter />;
      case 'recovery-manager':
        return <RecoveryManager />;
      case 'backup-history':
        return <BackupHistory />;
      case 'pwa-settings':
        return <PWASettings />;
      case 'notification-center':
        return <NotificationCenter />;
      case 'offline-manager':
        return <OfflineManager />;
      case 'aegisassist-manager':
        return <AegisAssistManager />;
      
      // Fallback
      default:
        return <Landing navigate={navigate} />;
    }
  };

  // Wrapper check
  if (!currentUser || isPublicRoute || currentRoute === 'verification') {
    // Public layout context (no sidebar dashboard)
    return (
      <>
        {renderPage()}
        <AegisAssistPanel />
        {/* If we're on public verification, we still want the floating dev switch console! */}
        {currentRoute === 'verification' && currentUser && (
          <DashboardLayout
            currentUser={currentUser}
            currentRoute={currentRoute}
            navigate={navigate}
            onLogout={handleLogout}
            onRoleSwitch={handleRoleSwitch}
          >
            <span className="hidden" />
          </DashboardLayout>
        )}
      </>
    );
  }

  // Authenticated layout context (Dashboard sidebar wrapper)
  return (
    <>
      <DashboardLayout
        currentUser={currentUser}
        currentRoute={currentRoute}
        navigate={navigate}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      >
        {renderPage()}
      </DashboardLayout>

      <AegisAssistPanel />

      {/* Security Expiration Floating Warn */}
      {showSessionWarning && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-panel border border-amber-500/30 bg-amber-950/90 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-slideUp text-xs max-w-sm text-amber-300">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shrink-0" />
          <div>
            <span className="font-extrabold uppercase tracking-wider block">Security Inactivity Warning</span>
            <p className="leading-tight">Your session will expire in <span className="font-bold text-white font-mono">{sessionTimeLeft}s</span> due to inactivity. Move mouse to stay logged in.</p>
          </div>
        </div>
      )}
    </>
  );
}
