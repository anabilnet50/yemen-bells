import fs from 'fs';

const filePath = 'c:/Users/Almuhtarif-One/Desktop/website Agras/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the overlay section
const startPattern = '{/* High-End Overlay - Moved Up slightly to accommodate the ticker */}';
// Find the start of the navigation buttons section
const endPattern = '{/* Hero Navigation Buttons - Sleek Style - Always visible on mobile for UX */}';

const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern);

if (startIndex !== -1 && endIndex !== -1) {
    const cleanOverlay = `
                    {/* High-End Overlay - Moved Up slightly to accommodate the ticker */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/90 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10 pb-16 md:pb-20">
                      {/* Urgent Badge - Repositioned to left/top to avoid slider collision on mobile */}
                      <div className="absolute top-4 left-6 z-50">
                        <span className={\`bg-primary-crimson text-white border border-primary-crimson \${mainArticle.category_slug === 'short-urgent' ? 'px-2 py-0.5 text-[8px] md:text-[10px]' : 'px-3 py-1 text-[10px] md:text-sm'} font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse\`}>
                          عاجل
                        </span>
                      </div>

                      {mainArticle.id !== 'placeholder-short-urgent' && (
                        <h2 className={\`text-white font-black leading-[1.2] mb-4 group-hover:text-accent-gold transition-all duration-500 drop-shadow-2xl line-clamp-3 \${
                          (mainArticle.short_title || mainArticle.title || '').length > 100 ? 'text-lg md:text-xl' :
                          (mainArticle.short_title || mainArticle.title || '').length > 60 ? 'text-xl md:text-2xl' :
                          'text-xl md:text-3xl'
                        }\`}>
                          {mainArticle.short_title || mainArticle.title}
                        </h2>
                      )}

                      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        {/* Metadata removed as per user request */}
                      </div>
                    </div>

                    `;
    
    // Replace EVERYTHING between startPattern and endPattern
    const newContent = content.substring(0, startIndex) + cleanOverlay + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully applied surgical fix to App.tsx');
} else {
    console.error(`Patterns not found: start=${startIndex}, end=${endIndex}`);
}
