import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { PageMeta } from '@/components/PageMeta.jsx';

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://workbee.space/#website',
      url: 'https://workbee.space/',
      name: 'WorkBee',
      description: 'Connect with qualified specialists for all your home improvement needs',
    },
    {
      '@type': 'Organization',
      '@id': 'https://workbee.space/#organization',
      url: 'https://workbee.space/',
      name: 'WorkBee',
      logo: { '@type': 'ImageObject', url: 'https://workbee.space/logo-192.png' },
    },
  ],
};
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, MapPin, Wrench, Paintbrush, Package, Hammer, Zap, Droplet, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { getUserImageUrl } from '@/lib/userImage';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReviewsCarousel from '@/components/ReviewsCarousel.jsx';
import FireworksIntro from '@/components/FireworksIntro.jsx';

const CONFETTI_COLORS = [
  '#ff4444','#ff8800','#ffdd00','#44cc44','#44aaff','#cc44ff','#ff44cc','#fff','#ffd700',
];
const CONFETTI_COUNT = 42;

const confettiPieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  id: i,
  x: (i / CONFETTI_COUNT) * 100 + (Math.sin(i * 2.3) * 5),
  delay: (i * 117) % 2800,
  duration: 2200 + (i * 83) % 1600,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + (i % 5) * 2,
  rotate: (i * 47) % 360,
  shape: i % 3,
}));

const LaunchPartyHero = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d0a4e 40%, #3d1060 70%, #1a0533 100%)' }}>

          {/* animated gradient shimmer */}
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,200,0,0.08)_50%,transparent_80%)] bg-[length:200%_100%] animate-[party-shimmer_3s_linear_infinite] pointer-events-none" />

          {/* confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {confettiPieces.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: '-12px',
                  width: p.shape === 0 ? p.size : p.shape === 1 ? p.size * 0.5 : p.size,
                  height: p.shape === 0 ? p.size * 0.4 : p.shape === 1 ? p.size * 1.8 : p.size,
                  borderRadius: p.shape === 2 ? '50%' : '2px',
                  backgroundColor: p.color,
                  animation: `confetti-fall ${p.duration}ms ease-in ${p.delay}ms infinite`,
                  transform: `rotate(${p.rotate}deg)`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          {/* floating balloons */}
          {['🎈','🎊','🎉','🎈','🎊'].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-3xl select-none pointer-events-none"
              style={{
                left: `${10 + i * 20}%`,
                bottom: '10%',
                animation: `balloon-float ${3 + i * 0.4}s ease-in-out ${i * 0.6}s infinite alternate`,
              }}
            >
              {emoji}
            </span>
          ))}

          {/* content */}
          <div className="relative z-10 p-10 md:p-16 text-center">
            <div className="text-5xl md:text-6xl mb-6 animate-[party-bounce_0.8s_ease-in-out_infinite_alternate]">🥳</div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              {t('banner.launch_title')}
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-8">
              {t('banner.launch_desc')}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-lg px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/30"
            >
              {t('banner.launch_cta')} 🎟️
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0)   rotate(0deg);   opacity: 0.9; }
          80%  { opacity: 0.7; }
          100% { transform: translateY(520px) rotate(720deg); opacity: 0; }
        }
        @keyframes balloon-float {
          from { transform: translateY(0) rotate(-4deg); }
          to   { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes party-bounce {
          from { transform: scale(1) rotate(-5deg); }
          to   { transform: scale(1.15) rotate(5deg); }
        }
        @keyframes party-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
};

const DndRollToast = ({ roll }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;

  const isNat20 = roll === 20;
  const isNat1  = roll === 1;
  const label   = isNat20 ? '🎆 Natural 20!' : isNat1 ? '💀 Critical Fail' : `🎲 You rolled ${roll}`;
  const bg      = isNat20 ? 'bg-amber-500 text-white shadow-amber-500/40'
                : isNat1  ? 'bg-red-700 text-white shadow-red-700/40'
                : 'bg-card text-foreground shadow-black/20';

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9997] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl ${bg} animate-[roll-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]`}
      style={{ minWidth: 180, textAlign: 'center' }}
    >
      <span className="text-4xl font-black leading-none">{roll}</span>
      <span className="text-sm font-semibold leading-tight">{label}</span>
      <style>{`
        @keyframes roll-in {
          from { transform: translateX(-50%) translateY(80px) scale(0.7); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0)   scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const categoryIcons = {
  'Apdailos darbai': Wrench,
  'Tapetavimas': Paintbrush,
  'Baldų surinkimas': Package,
  'Grindų klojimas': Hammer,
  'Elektrika': Zap,
  'Santechnika': Droplet
};

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [featuredContractors, setFeaturedContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dndRoll] = useState(() => Math.floor(Math.random() * 20) + 1);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, contractorsData] = await Promise.all([
          pb.collection('categories').getFullList({ $autoCancel: false }),
          pb.collection('users').getList(1, 4, {
            filter: 'userType = "contractor"',
            sort: '-rating',
            expand: 'categories',
            $autoCancel: false
          })
        ]);
        setCategories(categoriesData);
        setFeaturedContractors(contractorsData.items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/contractors?category=${categoryId}`);
  };

  const handleRoleClick = (e, role) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (role === 'client') navigate('/dashboard/client');
      else if (role === 'contractor') navigate('/dashboard/contractor');
    } else {
      navigate(`/register?type=${role}`);
    }
  };

  return (
    <>
      <PageMeta title={`WorkBee - ${t('home.title')}`} description={t('home.subtitle')} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(HOME_JSON_LD)}</script>
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <FireworksIntro roll={dndRoll} />
        <DndRollToast roll={dndRoll} />
        <Header />
        
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-10"></div>
          
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="/logo.svg" 
                alt="WorkBee Logo" 
                className="h-56 w-56 mx-auto mb-8"
              />
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                {t('home.title')}
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                {t('home.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-16">
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 transition-all duration-200 active:scale-[0.98] rounded-xl"
                  onClick={(e) => handleRoleClick(e, 'client')}
                >
                  {t('home.im_client')}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6 transition-all duration-200 active:scale-[0.98] rounded-xl"
                  onClick={(e) => handleRoleClick(e, 'contractor')}
                >
                  {t('home.im_contractor')}
                </Button>
              </div>

            </motion.div>
          </div>
        </section>

        {/* Launch Party Section */}
        <LaunchPartyHero />

        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('home.categories_title')}</h2>
              <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                {t('home.categories_subtitle')}
              </p>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => {
                  const IconComponent = categoryIcons[category.name] || Wrench;
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card 
                        className="bg-card hover:bg-muted/50 border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group rounded-2xl"
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        <CardContent className="p-6 flex items-center gap-5">
                          <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors duration-300">
                            <IconComponent className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">{t(`professions.${category.name}`, { defaultValue: category.name })}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('home.featured_title')}</h2>
              <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                {t('home.featured_subtitle')}
              </p>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-2xl" />
                ))}
              </div>
            ) : featuredContractors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredContractors.map((contractor, index) => (
                  <motion.div
                    key={contractor.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="bg-card border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-2 overflow-hidden h-full flex flex-col rounded-2xl">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {getUserImageUrl(contractor) ? (
                          <img
                            src={getUserImageUrl(contractor, { thumb: '400x400' })}
                            alt={contractor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <span className="text-5xl font-bold text-primary">
                              {contractor.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 flex flex-col flex-1">
                        <h3 className="font-semibold text-xl mb-1">{contractor.name}</h3>
                        <p className="text-sm text-primary font-medium mb-3">{contractor.profession}</p>
                        
                        {contractor.expand?.categories && contractor.expand.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {contractor.expand.categories.slice(0, 2).map(cat => (
                              <Badge key={cat.id} variant="secondary" className="text-xs bg-muted text-muted-foreground border-none font-medium">
                                {cat.name}
                              </Badge>
                            ))}
                            {contractor.expand.categories.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-none">
                                +{contractor.expand.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="font-medium">{contractor.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({contractor.reviewCount || 0} reviews)
                          </span>
                        </div>
                        
                        {contractor.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {contractor.bio}
                          </p>
                        )}

                        <div className="mt-auto pt-4">
                          <Button 
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl"
                            asChild
                          >
                            <Link to={`/contractor/${contractor.id}`}>{t('home.view_profile')}</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('home.no_featured')}</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('home.reviews_title')}</h2>
              <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                {t('home.reviews_subtitle')}
              </p>
            </motion.div>
            
            <ReviewsCarousel />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;