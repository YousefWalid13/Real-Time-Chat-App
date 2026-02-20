import { AuthProvider, useAuth } from "./context/AuthContext";
import GlobalStyles from "./components/GlobalStyles";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";

function Router() {
  const { auth } = useAuth();
  return auth?.token ? <ChatPage /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <Router />
    </AuthProvider>
  );
}
