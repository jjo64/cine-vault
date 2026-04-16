import { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Estilos
import './MovieDetail.css';

// Hook de lógica
import { useMovieDetail } from '../features/movie-detail/hooks/useMovieDetail';

// Componentes Refactorizados
import { Hero } from '../features/movie-detail/components/Hero/Hero';
import { DirectorQuote } from '../features/movie-detail/components/DirectorQuote';
import { Synopsis } from '../features/movie-detail/components/Synopsis';
import { Themes } from '../features/movie-detail/components/Themes';
import { Stills } from '../features/movie-detail/components/Stills';
import { CastCrew } from '../features/movie-detail/components/CastCrew';
import { Reviews } from '../features/movie-detail/components/Reviews';
import { Sidebar } from '../features/movie-detail/components/Sidebar';
import { Footer } from '../features/movie-detail/components/Footer';
import { InlineComposer } from '../features/movie-detail/components/InlineComposer';
import { ReviewLogModal } from '../features/movie-detail/components/ReviewLogModal';
import { AddToListModal } from '../features/movie-detail/components/AddToListModal';
import { NoticeBar } from '../features/movie-detail/components/NoticeBar';
import { Grain } from '../features/movie-detail/components/Grain';
import { SeoHead } from '../components/SeoHead';

// Utilidades
import { buildMovieCanonicalPath, getDirectorObj } from '../features/movie-detail/utils/mapping';
import { buildMovieSchema } from '../utils/seo/buildMovieSchema';
import { C, SERIF, SANS, TMDB_BASE, SIZES } from '../features/movie-detail/constants';

export default function MovieDetailPage() {
  const navigate = useNavigate();
  const composerRef = useRef<HTMLDivElement | null>(null);
  
  const {
    movie,
    reviews,
    loading,
    error,
    notice,
    noticeType,
    viewer,
    userRating,
    inVault,
    inWatchlist,
    liked,
    similar,
    likedReviewIds,
    userLists,
    reviewLogOpen,
    addToListOpen,
    composerMode,
    composerText,
    reviewLogForm,
    reviewLogSaving,
    selectedListId,
    newListName,
    newListDescription,
    addToListLoading,
    addToListSaving,
    addToListCreating,
    setReviewLogOpen,
    setAddToListOpen,
    setComposerMode,
    setComposerText,
    setReviewLogForm,
    setSelectedListId,
    setNewListName,
    setNewListDescription,
    handleRate,
    handleToggleVault,
    handleToggleWatchlist,
    handleToggleFavorite,
    handleAddToList,
    handleConfirmAddToList,
    handleCreateListFromModal,
    handleShare,
    handleWriteReview,
    handleSaveReviewLog,
    handleToggleReviewLike,
    handleSubmitComposer,
    handleEditReview,
    handleDeleteReview,
    handleReplyReview,
  } = useMovieDetail();

  // Scroll al composer cuando se activa
  useEffect(() => {
    if (composerMode) {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [composerMode]);

  const directorObj = useMemo(() => getDirectorObj(movie), [movie]);

  const stills = useMemo(() => {
    if (!movie?.images?.backdrops?.length) return [];
    return movie.images.backdrops
      .slice(0, 5)
      .map((item) => `${TMDB_BASE}${SIZES.STILL}${item.file_path}`);
  }, [movie]);

  const themes = useMemo(() => {
    const fromGenres = (movie?.genres || []).map((genre) => genre.name);
    const base = ['Slow cinema', 'Cine de autor', 'Filosofía del deseo'];
    return [...new Set([...fromGenres, ...base])];
  }, [movie]);

  const seo = useMemo(() => {
    if (!movie) return null;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
    const title = year ? `${movie.title} (${year}) | CineVault` : `${movie.title} | CineVault`;
    const description = (movie.overview || movie.tagline || `Descubre ${movie.title} en CineVault.`).slice(0, 155);
    const image = movie.backdrop_path ? `${TMDB_BASE}w1280${movie.backdrop_path}` : `${TMDB_BASE}w780${movie.poster_path}`;
    const canonicalPath = buildMovieCanonicalPath(movie.id, movie.title);

    return {
      title,
      description,
      canonical: `https://cinevault.art${canonicalPath}`,
      image,
      structuredData: buildMovieSchema({
        name: movie.title,
        description,
        image,
        datePublished: movie.release_date,
        directorName: directorObj?.name,
        genres: (movie.genres || []).map((genre) => genre.name),
        ratingValue: movie.vote_average,
        ratingCount: movie.vote_count,
      }),
    };
  }, [movie, directorObj]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic' }}>
        Cargando película...
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: '#ff8a8a', fontFamily: SANS }}>
        <div style={{ textAlign: 'center' }}>
          <p>{error || 'No se pudo cargar la película'}</p>
          <button onClick={() => navigate('/')} style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.text, padding: '8px 14px', cursor: 'pointer' }}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS, overflowX: 'hidden' }}>
      {seo && (
        <SeoHead.Movie
          title={seo.title}
          description={seo.description}
          canonical={seo.canonical}
          image={seo.image}
          structuredData={seo.structuredData || ''}
        />
      )}
      
      <Grain />
      <NoticeBar message={notice} type={noticeType} />

      <ReviewLogModal
        open={reviewLogOpen}
        movie={movie}
        membership={viewer?.membership}
        role={viewer?.role}
        text={reviewLogForm.text}
        rating={reviewLogForm.rating}
        mode={reviewLogForm.mode}
        veredicto={reviewLogForm.veredicto}
        contieneSpoilers={reviewLogForm.contieneSpoilers}
        citaDialogo={reviewLogForm.citaDialogo}
        citaPersonaje={reviewLogForm.citaPersonaje}
        timestamps={reviewLogForm.timestamps}
        dimensions={reviewLogForm.dimensions}
        liked={reviewLogForm.liked}
        seenDate={reviewLogForm.seenDate}
        seenBefore={reviewLogForm.seenBefore}
        saving={reviewLogSaving}
        onClose={() => setReviewLogOpen(false)}
        onTextChange={(val) => setReviewLogForm(p => ({ ...p, text: val }))}
        onRatingChange={(val) => setReviewLogForm(p => ({ ...p, rating: val }))}
        onModeChange={(val) => setReviewLogForm(p => ({ ...p, mode: val }))}
        onVeredictoChange={(val) => setReviewLogForm(p => ({ ...p, veredicto: val }))}
        onContieneSpoilersChange={(val) => setReviewLogForm(p => ({ ...p, contieneSpoilers: val }))}
        onCitaDialogoChange={(val) => setReviewLogForm(p => ({ ...p, citaDialogo: val }))}
        onCitaPersonajeChange={(val) => setReviewLogForm(p => ({ ...p, citaPersonaje: val }))}
        onDimensionsChange={(key, val) => setReviewLogForm(p => ({ ...p, dimensions: { ...p.dimensions, [key]: val } }))}
        onAddTimestamp={() => setReviewLogForm(p => ({ ...p, timestamps: [...p.timestamps, { minuto: '', descripcion: '' }] }))}
        onTimestampChange={(idx, field, val) => setReviewLogForm(p => ({ ...p, timestamps: p.timestamps.map((t, i) => i === idx ? { ...t, [field]: val } : t) }))}
        onRemoveTimestamp={(idx) => setReviewLogForm(p => ({ ...p, timestamps: p.timestamps.filter((_, i) => i !== idx) }))}
        onToggleLike={() => setReviewLogForm(p => ({ ...p, liked: !p.liked }))}
        onSeenDateChange={(val) => setReviewLogForm(p => ({ ...p, seenDate: val }))}
        onSeenBeforeChange={(val) => setReviewLogForm(p => ({ ...p, seenBefore: val }))}
        onSave={handleSaveReviewLog}
      />

      <AddToListModal
        open={addToListOpen}
        movieTitle={movie.title}
        loading={addToListLoading}
        saving={addToListSaving}
        lists={userLists}
        selectedListId={selectedListId}
        createName={newListName}
        createDescription={newListDescription}
        creating={addToListCreating}
        onClose={() => setAddToListOpen(false)}
        onSelectList={setSelectedListId}
        onCreateNameChange={setNewListName}
        onCreateDescriptionChange={setNewListDescription}
        onCreateList={handleCreateListFromModal}
        onConfirm={handleConfirmAddToList}
      />



      <Hero
        title={movie.title || 'Sin título'}
        originalTitle={movie.original_title || movie.title}
        releaseYear={movie.release_date ? new Date(movie.release_date).getFullYear() : '----'}
        country={movie.production_countries?.[0]?.name || 'País no disponible'}
        runtime={movie.runtime ? `${movie.runtime} min` : 'Duración desconocida'}
        genresText={(movie.genres || []).slice(0, 2).map((genre) => genre.name).join(' · ') || 'Sin género'}
        director={directorObj}
        score={((movie.vote_average || 0) / 2).toFixed(1)}
        votes={(movie.vote_count || 0).toLocaleString('es-ES')}
        posterPath={movie.poster_path}
        backdropPath={movie.backdrop_path}
        mediaType="movie"
        userRating={userRating}
        inVault={inVault}
        inWatchlist={inWatchlist}
        liked={liked}
        onRate={handleRate}
        onToggleVault={handleToggleVault}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleFavorite={handleToggleFavorite}
        onAddToList={handleAddToList}
        onWriteReview={handleWriteReview}
        onShare={handleShare}
      />

      <DirectorQuote director={directorObj?.name || 'Desconocido'} />

      <div className="md-main-layout">
        <main>
          <Synopsis overview={movie.overview || ''} tagline={movie.tagline} />
          <Themes themes={themes} />
          {stills.length > 0 && <Stills stills={stills} />}
          <CastCrew cast={movie.credits?.cast || []} crew={movie.credits?.crew || []} />
          <Reviews
            reviews={reviews}
            movieTmdbId={movie.id}
            movieTitle={movie.title || ''}
            likedReviewIds={likedReviewIds}
            viewerId={viewer?.id ?? null}
            onToggleLike={handleToggleReviewLike}
            onReply={handleReplyReview}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            onWriteReview={handleWriteReview}
          />
          <div ref={composerRef}>
            <InlineComposer
              mode={composerMode}
              text={composerText}
              onTextChange={setComposerText}
              onCancel={() => {
                setComposerMode(null);
                setComposerText('');
              }}
              onSubmit={handleSubmitComposer}
            />
          </div>
        </main>

        <Sidebar 
          movie={movie} 
          similar={similar} 
          directorObj={directorObj ? { id: directorObj.id, name: directorObj.name } : null} 
        />
      </div>

      <Footer />
    </div>
  );
}
