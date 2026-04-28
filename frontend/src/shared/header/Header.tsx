import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@gravity-ui/uikit';
import { ArrowRightFromSquare, Bars } from '@gravity-ui/icons';
import { useAuth } from '@/core/services';
import './Header.scss';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="app-header">
      <Button
        view="flat"
        size="m"
        className="app-header__menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <Icon data={Bars} size={16} />
      </Button>

      <span className="app-header__title" onClick={() => handleNavigate('/')}>
        LarpBabylone
      </span>

      <nav className={`app-header__nav ${menuOpen ? 'app-header__nav--open' : ''}`}>
        <Button view="flat" size="m" onClick={() => handleNavigate('/')}>
          Documents
        </Button>
        <Button view="flat" size="m" onClick={() => handleNavigate('/objects')}>
          Objets
        </Button>
        {user?.isGroupAdmin && (
          <Button view="flat" size="m" onClick={() => handleNavigate('/groups')}>
            Groupes
          </Button>
        )}
      </nav>

      <div className="app-header__right">
        {user && (
          <>
            <span className="app-header__user">{user.username}</span>
            <Button view="flat" size="m" onClick={handleLogout}>
              <Icon data={ArrowRightFromSquare} size={16} />
              <span className="app-header__logout-label">Déconnexion</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
