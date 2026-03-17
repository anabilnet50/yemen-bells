import fs from 'fs';

const filePath = 'c:/Users/Almuhtarif-One/Desktop/website Agras/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the Hero guard
const heroGuardStart = '{mainArticle && (';
const afterHeroSection = '{/* Ad Space - Visible only on Desktop */}';

const startIndex = content.indexOf(heroGuardStart);
const endIndex = content.indexOf(afterHeroSection);

if (startIndex !== -1 && endIndex !== -1) {
    const refinedHero = `
              {mainArticle && (
                <div
                  onClick={mainArticle.category_slug === 'short-urgent' ? undefined : () => navigate(\`/article/\${mainArticle.id}\`)}
                  className={\`relative h-[250px] sm:h-[350px] md:h-[480px] bg-primary-navy rounded-none md:rounded-3xl overflow-hidden \${mainArticle.category_slug === 'short-urgent' ? '' : 'cursor-pointer shadow-none md:shadow-premium border-none md:border border-white/5'} group\`}
                >
                  {/* Watermark Logo - Premium Corner Branding (Glass Style) */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 md:top-3 md:right-3 z-40 p-0.5 pointer-events-none group-hover:scale-105 transition-transform duration-1000"
                  >
                    <div className="bg-black/40 backdrop-blur-2xl px-4 md:px-5 py-1.5 md:py-2 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-3 relative">
                        <motion.span 
                          animate={{ 
                            textShadow: ["0 0 5px rgba(255,255,255,0.2)", "0 0 15px rgba(255,255,255,0.5)", "0 0 5px rgba(255,255,255,0.2)"]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-white font-black text-xl md:text-2xl tracking-[0.2em] relative z-20"
                        >
                          𐩠𐩵𐩪
                        </motion.span>
                        <div className="w-px h-5 md:h-7 bg-white/20"></div>
                        <div className="relative overflow-hidden pr-0.5">
                          <motion.span 
                            animate={{ 
                              x: ["100%", "0%", "0%", "100%"],
                              opacity: [0, 1, 1, 0]
                            }}
                            transition={{ 
                              duration: 5, 
                              repeat: Infinity,
                              times: [0, 0.2, 0.8, 1],
                              ease: "easeInOut"
                            }}
                            className="block text-white font-black text-xl md:text-3xl tracking-tighter"
                          >
                            هـدس
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {mainArticle.video_url && videoLoaded ? (
                    (() => {
                      const ytUrl = getYoutubeEmbedUrl(mainArticle.video_url);
                      return ytUrl ? (
                        <iframe
                          src={ytUrl}
                          className="w-full h-full pointer-events-none object-cover"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video
                          src={mainArticle.video_url}
                          autoPlay
                          muted
                          loop
                          className="w-full h-full object-cover"
                        />
                      );
                    })()
                  ) : (
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="w-full h-full relative"
                    >
                      <div className="w-full h-full relative">
                        {mainArticle.image_url ? (
                          <img
                            src={mainArticle.image_url}
                            alt={mainArticle.title || 'عاجل'}
                            className={\`w-full h-full object-cover transition-transform duration-1000 scale-100 \${mainArticle.category_slug === 'short-urgent' ? '' : 'group-hover:scale-105'}\`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-crimson flex flex-col items-center justify-center p-8 overflow-hidden relative">
                             <div className="relative z-10 flex flex-col items-center gap-6">
                             </div>
                          </div>
                        )}
                      </div>
                      {mainArticle.video_url && !videoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/30">
                            <Play className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Professional TV-Style News Ticker (Al Hadath/Al Jazeera Style) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-primary-crimson z-20 flex items-stretch h-10 md:h-12 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                    <div className="bg-primary-crimson text-white px-1.5 md:px-4 flex items-center justify-center font-black text-[9px] md:text-xs uppercase tracking-tighter md:tracking-widest relative group/urgent shrink-0 z-30 shadow-[5px_0_15px_rgba(225,29,72,0.3)]">
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>عاجل
                    </div>
                    <div className="flex-1 overflow-hidden flex items-center bg-white border-x border-gray-100 relative">
                      <div className="whitespace-nowrap text-primary-navy font-black text-sm md:text-base w-full" style={{ gap: 0 }}>
                        {(() => {
                          const TickerItemContent = (
                            <>
                              {settings?.custom_ticker_text && settings.custom_ticker_text.trim() !== '' && (
                                <span className="flex items-center gap-4 text-primary-navy drop-shadow-sm font-black text-sm md:text-base group/tickeritem shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-primary-crimson shadow-[0_0_10px_rgba(225,29,72,0.8)]"></span>
                                  {settings.custom_ticker_text}
                                </span>
                              )}
                              {urgentArticles.map(a => (
                                <Link key={\`urgent-\${a.id}\`} to={\`/article/\${a.id}\`} className="flex items-center gap-4 hover:text-primary-crimson transition-colors group/tickeritem shrink-0">
                                  <span className="w-1.5 h-1.5 bg-primary-crimson rotate-45 group-hover/tickeritem:scale-125 transition-transform"></span>
                                  {a.title}
                                  {a.category_slug === 'opinion' && (
                                    <span className="text-primary-crimson/80 mr-2"> - {a.writer_name || a.author || "موقع هدس"}</span>
                                  )}
                                </Link>
                              ))}
                            </>
                          );
                          const FallbackContent = (
                            <span className="text-gray-400 font-bold text-[10px] md:text-xs tracking-widest shrink-0 flex items-center gap-4">
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>هـدس .. تغطية حية ومستمرة لكل ما يدور في الساحة اليمنية والمنطقة
                            </span>
                          );
                          const hasCustomText = settings?.custom_ticker_text && settings.custom_ticker_text.trim() !== '';
                          const blocksToRender = (urgentArticles.length > 0 || hasCustomText) ? TickerItemContent : FallbackContent;
                          const itemsCount = Math.max(1, urgentArticles.length) + (hasCustomText ? 1 : 0);
                          const calculatedDuration = itemsCount * 8 * 15;
                          return (
                            <div className="flex animate-marquee hover:pause w-max" style={{ animationDuration: \`\${calculatedDuration}s\` }}>
                              <div className="flex items-center gap-12 px-6">
                                {[...Array(8)].map((_, i) => (
                                  <React.Fragment key={\`h1-\${i}\`}>{blocksToRender}</React.Fragment>
                                ))}
                              </div>
                              <div className="flex items-center gap-12 px-6" aria-hidden="true">
                                {[...Array(8)].map((_, i) => (
                                  <React.Fragment key={\`h2-\${i}\`}>{blocksToRender}</React.Fragment>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="bg-primary-crimson text-white px-1 md:px-2 flex items-center justify-center shrink-0 relative overflow-hidden group/clock z-20 shadow-[-10px_0_20px_white]">
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      <DigitalClock />
                    </div>
                  </div>

                  {/* High-End Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/90 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10 pb-16 md:pb-20">
                    {/* Content Stack */}
                    <div className="flex flex-col items-end gap-3 w-full max-w-4xl mx-auto">
                      {/* Urgent Badge - Positioned as per screenshot blue square (Right-side above title) */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-start w-full mb-1 pr-6 md:pr-10"
                      >
                         <span className={\`bg-primary-crimson text-white border border-primary-crimson \${mainArticle.category_slug === 'short-urgent' ? 'px-2 py-0.5 text-[8px] md:text-[10px]' : 'px-3 py-1 text-[10px] md:text-sm'} font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse\`}>
                           عاجل
                         </span>
                      </motion.div>

                      {mainArticle.id !== 'placeholder-short-urgent' && (
                        <h2 className={\`text-white font-black leading-[1.2] mb-4 group-hover:text-accent-gold transition-all duration-500 drop-shadow-2xl line-clamp-3 text-right \${
                          (mainArticle.short_title || mainArticle.title || '').length > 100 ? 'text-lg md:text-xl' :
                          (mainArticle.short_title || mainArticle.title || '').length > 60 ? 'text-xl md:text-2xl' :
                          'text-xl md:text-3xl'
                        }\`}>
                          {mainArticle.short_title || mainArticle.title}
                        </h2>
                      )}
                    </div>
                  </div>

                  {/* Hero Navigation Buttons - Shifted SLIGHTLY UPWARDS */}
                  <div className="absolute top-[40%] -translate-y-1/2 left-4 right-4 flex justify-between z-[60] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500">
                    <button onClick={handleNextHero} className="w-10 h-10 md:w-12 md:h-12 bg-black/40 backdrop-blur-xl text-white rounded-2xl border border-white/20 flex items-center justify-center hover:bg-primary-crimson hover:scale-110 active:scale-95 transition-all shadow-2xl"><ChevronRight className="w-6 h-6 md:w-7 md:h-7" /></button>
                    <button onClick={handlePrevHero} className="w-10 h-10 md:w-12 md:h-12 bg-black/40 backdrop-blur-xl text-white rounded-2xl border border-white/20 flex items-center justify-center hover:bg-primary-crimson hover:scale-110 active:scale-95 transition-all shadow-2xl"><ChevronLeft className="w-6 h-6 md:w-7 md:h-7" /></button>
                  </div>
                </div>
              )}
            </div>
            `;
            
    const newContent = content.substring(0, startIndex) + refinedHero + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully refined hero UI (final padding fix for right side)');
} else {
    console.error('Could not find hero start or end patterns');
}
