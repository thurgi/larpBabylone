import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@gravity-ui/uikit';
import { ArrowRightFromSquare } from '@gravity-ui/icons';
import { useAuth } from '@/core/services';
import './Header.scss';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="app-header__left">
        <span className="app-header__title" onClick={() => navigate('/')}>
          LarpBabylone
        </span>
        <nav className="app-header__nav">
          <Button view="flat" size="m" onClick={() => navigate('/')}>
            Documents
          </Button>
          {user?.isGroupAdmin && (
            <Button view="flat" size="m" onClick={() => navigate('/groups')}>
              Groupes
            </Button>
          )}
        </nav>
      </div>
      {user && (
        <div className="app-header__right">
          <span className="app-header__user">{user.username}</span>
          <Button view="flat" size="m" onClick={handleLogout}>
            <Icon data={ArrowRightFromSquare} size={16} />
            Déconnexion
          </Button>
        </div>
      )}
    </header>
  );
}
