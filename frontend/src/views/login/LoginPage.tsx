import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Text } from '@gravity-ui/uikit';
import { useAuth } from '@/core/services';
import './LoginPage.scss';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://auth.localhost:3000';

function buildLoginUrl(provider: 'discord' | 'google'): string {
  // Transmet l'URL courante pour y revenir après le login
  const returnTo = encodeURIComponent(window.location.href);
  return `${AUTH_SERVICE_URL}/auth/${provider}?returnTo=${returnTo}`;
}

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="login-page">
      <Card className="login-page__card" size="l">
        <Text variant="header-1" className="login-page__title">
          LarpBabylone
        </Text>
        <Text variant="body-2" color="secondary" className="login-page__subtitle">
          Connectez-vous pour accéder à vos documents
        </Text>
        <div className="login-page__buttons">
          <Button view="action" size="xl" width="max" href={buildLoginUrl('discord')}>
            Se connecter avec Discord
          </Button>
          <Button view="outlined" size="xl" width="max" href={buildLoginUrl('google')}>
            Se connecter avec Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
