import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PortfolioGallery = ({ contractorId }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { item, beforeIdx, afterIdx }

  useEffect(() => {
    pb.collection('portfolio_items').getFullList({
      filter: `contractorId = "${contractorId}"`,
      sort: '-created',
      $autoCancel: false,
    })
      .then(data => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contractorId]);

  if (loading) {
    return (
      <Card className="bg-card border-border rounded-2xl">
        <CardHeader><CardTitle>{t('portfolio_gallery.title')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!items.length) return null;

  const getUrl = (item, filename, thumb) =>
    pb.files.getURL(item, filename, thumb ? { thumb } : {});

  const openLightbox = (item) =>
    setLightbox({ item, beforeIdx: 0, afterIdx: 0 });

  const shiftLightbox = (side, dir) =>
    setLightbox(prev => {
      if (!prev) return prev;
      const key = side === 'before' ? 'beforeIdx' : 'afterIdx';
      const arr = side === 'before' ? prev.item.beforePhotos : prev.item.afterPhotos;
      const next = (prev[key] + dir + arr.length) % arr.length;
      return { ...prev, [key]: next };
    });

  return (
    <>
      <Card className="bg-card border-border rounded-2xl">
        <CardHeader><CardTitle>{t('portfolio_gallery.title')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(item => {
              const hasBefore = item.beforePhotos?.length > 0;
              const hasAfter  = item.afterPhotos?.length > 0;
              const beforeUrl = hasBefore ? getUrl(item, item.beforePhotos[0], '800x500') : null;
              const afterUrl  = hasAfter  ? getUrl(item, item.afterPhotos[0],  '800x500') : null;

              return (
                <div
                  key={item.id}
                  className="group cursor-pointer rounded-xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-0.5"
                  onClick={() => openLightbox(item)}
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {hasBefore && hasAfter ? (
                      <>
                        <img
                          src={beforeUrl}
                          alt={t('portfolio_gallery.before')}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ clipPath: 'inset(0 50% 0 0)' }}
                        />
                        <img
                          src={afterUrl}
                          alt={t('portfolio_gallery.after')}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ clipPath: 'inset(0 0 0 50%)' }}
                        />
                        {/* Divider line */}
                        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 z-10" />
                        <span className="absolute bottom-2 left-2 z-10 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          {t('portfolio_gallery.before')}
                        </span>
                        <span className="absolute bottom-2 right-2 z-10 bg-primary/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          {t('portfolio_gallery.after')}
                        </span>
                      </>
                    ) : (
                      <img
                        src={afterUrl || beforeUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-3 bg-card">
                    <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 opacity-60">
                      {[hasBefore && `${item.beforePhotos.length} before`, hasAfter && `${item.afterPhotos.length} after`]
                        .filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/92 z-50 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-white font-semibold truncate">{lightbox.item.title}</p>
            <button
              className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-5xl">
              {lightbox.item.beforePhotos?.length > 0 && lightbox.item.afterPhotos?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Before panel */}
                  <div>
                    <p className="text-center text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">{t('portfolio_gallery.before')}</p>
                    <div className="relative">
                      <img
                        src={getUrl(lightbox.item, lightbox.item.beforePhotos[lightbox.beforeIdx])}
                        alt={t('portfolio_gallery.before')}
                        className="w-full rounded-xl object-contain max-h-[65vh]"
                      />
                      {lightbox.item.beforePhotos.length > 1 && (
                        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
                          <button className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80" onClick={() => shiftLightbox('before', -1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            {lightbox.beforeIdx + 1}/{lightbox.item.beforePhotos.length}
                          </span>
                          <button className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80" onClick={() => shiftLightbox('before', 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After panel */}
                  <div>
                    <p className="text-center text-primary text-xs font-semibold uppercase tracking-widest mb-3">{t('portfolio_gallery.after')}</p>
                    <div className="relative">
                      <img
                        src={getUrl(lightbox.item, lightbox.item.afterPhotos[lightbox.afterIdx])}
                        alt={t('portfolio_gallery.after')}
                        className="w-full rounded-xl object-contain max-h-[65vh]"
                      />
                      {lightbox.item.afterPhotos.length > 1 && (
                        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
                          <button className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80" onClick={() => shiftLightbox('after', -1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            {lightbox.afterIdx + 1}/{lightbox.item.afterPhotos.length}
                          </span>
                          <button className="bg-black/60 text-white rounded-full p-1 hover:bg-black/80" onClick={() => shiftLightbox('after', 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={getUrl(lightbox.item,
                    lightbox.item.afterPhotos?.[lightbox.afterIdx] ||
                    lightbox.item.beforePhotos?.[lightbox.beforeIdx]
                  )}
                  alt={lightbox.item.title}
                  className="w-full max-h-[80vh] object-contain rounded-xl mx-auto"
                />
              )}

              {lightbox.item.description && (
                <p className="text-center text-white/50 text-sm mt-5">{lightbox.item.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortfolioGallery;
