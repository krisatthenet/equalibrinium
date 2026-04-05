import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
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
      <Helmet>
        <title>WorkBee - {t('home.title')}</title>
        <meta name="description" content={t('home.subtitle')} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
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

        {/* Q2 Release Pulsing Section */}
        <section className="py-16 bg-background relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-custom-pulse bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/50 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
              <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('home.q2_release_title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('home.q2_release_desc')}
              </p>
            </div>
          </div>
        </section>

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