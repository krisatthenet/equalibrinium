import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { getUserImageUrl } from '@/lib/userImage';
import useUnreadCount from '@/hooks/useUnreadCount.js';
import { Menu, X, User, LogOut, LayoutDashboard, Settings, Heart, MessageCircle } from 'lucide-react';
import NotificationsBell from './NotificationsBell.jsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import LanguageSelector from './LanguageSelector.jsx';
import LaunchPartyBanner from './LaunchPartyBanner.jsx';
import BetaBadge from './BetaBadge.jsx';
import D20Icon from './D20Icon.jsx';

const VytisIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shield */}
    <path d="M4 4 H56 V54 Q30 78 30 78 Q30 78 4 54 Z" fill="#BE0032"/>
    {/* Horse body */}
    <ellipse cx="30" cy="52" rx="16" ry="8" fill="white" transform="rotate(-10 30 52)"/>
    {/* Horse head/neck */}
    <path d="M43,44 Q48,36 46,30 Q44,26 40,28 Q36,30 38,36 Q40,40 43,44" fill="white"/>
    {/* Horse front legs */}
    <line x1="38" y1="58" x2="34" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="44" y1="56" x2="48" y2="68" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    {/* Horse rear legs */}
    <line x1="20" y1="58" x2="16" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="26" y1="60" x2="24" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    {/* Knight torso */}
    <rect x="26" y="30" width="12" height="16" rx="2" fill="white"/>
    {/* Knight helmet */}
    <rect x="28" y="20" width="10" height="12" rx="2" fill="white"/>
    {/* Sword arm + sword */}
    <line x1="36" y1="34" x2="50" y2="16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="44" y1="19" x2="56" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    {/* Shield arm */}
    <path d="M28,36 L18,42 L17,52 Q22,56 28,52 Z" fill="white"/>
  </svg>
);

const Header = () => {
  const { t } = useTranslation();
  const { isAuthenticated, currentUser, logout, userType } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (userType === 'contractor') return '/dashboard/contractor';
    if (userType === 'influencer') return '/dashboard/influencer';
    if (userType === 'client') return '/dashboard/client';
    return '/';
  };

  const avatarUrl = getUserImageUrl(currentUser, { thumb: '100x100' });
  const unreadCount = useUnreadCount(isAuthenticated ? currentUser?.id : null);

  return (
    <>
      <LaunchPartyBanner />
      <header className="sticky top-0 z-40 bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-md border-b border-border shadow-sm">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20 md:h-24">
            <div className="flex items-center gap-4 md:gap-6">
              <Link to="/" className="flex items-center transition-transform hover:scale-105 duration-300">
                <D20Icon className="w-16 h-16 md:w-20 md:h-20" />
              </Link>
              <BetaBadge />
              <div className="hidden lg:flex items-center gap-1.5 bg-muted/60 border border-border px-2.5 py-1 rounded-full text-xs text-muted-foreground">
                <VytisIcon className="w-4 h-4 shrink-0" />
                <span>Proud to be Lithuanian</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground hover:text-primary font-medium transition-colors duration-200">
                {t('header.home')}
              </Link>
              <Link to="/explore" className="text-foreground hover:text-primary font-medium transition-colors duration-200">
                {t('header.explore')}
              </Link>
              <Link to="/register" className="text-foreground hover:text-primary font-medium transition-colors duration-200">
                {t('header.account')}
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <LanguageSelector />
              
              {!isAuthenticated ? (
                <>
                  <Button variant="ghost" asChild className="text-foreground hover:bg-muted hover:text-foreground font-medium">
                    <Link to="/login">{t('header.login')}</Link>
                  </Button>
<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold transition-all active:scale-[0.98]">
                    <Link to="/register">{t('header.register')}</Link>
                  </Button>
                </>
              ) : (
                <>
                <NotificationsBell userId={currentUser?.id} />
                <Link to={getDashboardLink() + '?tab=messages'} className="relative">
                  <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:bg-muted" aria-label="Messages">
                    <MessageCircle className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 text-foreground hover:bg-muted hover:text-foreground font-medium h-auto py-2 px-3 rounded-full border border-transparent hover:border-border transition-all">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={currentUser?.name || 'User'} className="w-8 h-8 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="hidden sm:inline-block">{currentUser?.name || currentUser?.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border rounded-xl shadow-lg">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to={getDashboardLink()} className="flex items-center gap-2 py-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t('header.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    {userType === 'client' && (
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/favourites" className="flex items-center gap-2 py-2">
                          <Heart className="h-4 w-4 text-rose-500" />
                          Favourite Contractors
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to="/settings" className="flex items-center gap-2 py-2">
                        <Settings className="h-4 w-4" />
                        {t('header.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border my-1" />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg py-2">
                      <LogOut className="h-4 w-4" />
                      {t('header.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && <NotificationsBell userId={currentUser?.id} />}
              <LanguageSelector />
              <button
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border bg-background absolute left-0 right-0 px-6 shadow-xl z-50">
              <nav className="flex flex-col gap-4">
                <Link to="/" className="text-foreground font-medium hover:text-primary transition-colors duration-200" onClick={() => setMobileMenuOpen(false)}>
                  {t('header.home')}
                </Link>
                <Link to="/explore" className="text-foreground font-medium hover:text-primary transition-colors duration-200" onClick={() => setMobileMenuOpen(false)}>
                  {t('header.explore')}
                </Link>
                <Link to="/register" className="text-foreground font-medium hover:text-primary transition-colors duration-200" onClick={() => setMobileMenuOpen(false)}>
                  {t('header.account')}
                </Link>
                {!isAuthenticated ? (
                  <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-border">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted font-medium">{t('header.login')}</Button>
                    </Link>
<Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">{t('header.register')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-muted/30 rounded-xl">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="User" className="w-10 h-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{currentUser?.name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{currentUser?.email}</span>
                      </div>
                    </div>
                    <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted font-medium">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        {t('header.dashboard')}
                      </Button>
                    </Link>
                    <Link to={getDashboardLink() + '?tab=messages'} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted font-medium relative">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Messages
                        {unreadCount > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 px-1 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    {userType === 'client' && (
                      <Link to="/favourites" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted font-medium">
                          <Heart className="h-4 w-4 mr-2 text-rose-500" />
                          Favourite Contractors
                        </Button>
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted font-medium">
                        <Settings className="h-4 w-4 mr-2" />
                        {t('header.settings')}
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 font-medium" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('header.logout')}
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;