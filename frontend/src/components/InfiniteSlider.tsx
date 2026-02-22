import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';

import { createSlug } from '../utils/stringUtils';

interface Movie {
    id: number;
    title: string;
    poster_path: string;
    backdrop_path: string;
}

const InfiniteSlider: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies/popular`);
                const data = await res.json();
                // Tomamos el top 10
                setMovies(data.results.slice(0, 10));
            } catch (error) {
                console.error("Error fetching popular movies:", error);
            }
        };
        fetchPopular();
    }, []);

    useEffect(() => {
        if (movies.length === 0 || !wrapperRef.current) return;

        const boxes = gsap.utils.toArray('.slider-card');

        const loop = horizontalLoop(boxes, {
            paused: false,
            repeat: -1,
            speed: 0.5,
            paddingRight: 20
        });

        return () => {
            if (loop) loop.kill();
        };
    }, [movies]);

    return (
        <section className="infinite-slider-section" style={{ overflow: 'hidden', padding: '20px 0', background: 'transparent', maxWidth: '1000px', margin: '0 auto' }}>
            <div ref={containerRef} style={{ width: '100%', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                <div ref={wrapperRef} className="slider-wrapper" style={{ display: 'flex', gap: '20px', width: 'max-content' }}>
                    {movies.map((movie) => (
                        <Link key={movie.id} to={`/movie/${movie.id}-${createSlug(movie.title)}`} className="slider-card" style={{ flexShrink: 0, textDecoration: 'none', position: 'relative' }}>
                            <img
                                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                alt={movie.title}
                                style={{
                                    width: '180px',
                                    height: '270px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    transition: 'transform 0.3s ease',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                                onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3 })}
                                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.3 })}
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Helper function de GSAP para loops infinitos
// Ref: https://greensock.com/docs/v3/HelperFunctions#loop
function horizontalLoop(items: any[], config: any) {
    items = gsap.utils.toArray(items);
    config = config || {};
    let tl = gsap.timeline({ repeat: config.repeat, paused: config.paused, defaults: { ease: "none" }, onReverseComplete: () => { tl.totalTime(tl.rawTime() + tl.duration() * 100); } }),
        length = items.length,
        startX = items[0].offsetLeft,
        times: any[] = [],
        widths: any[] = [],
        xPercents: any[] = [],
        curIndex = 0,
        pixelsPerSecond = (config.speed || 1) * 100,
        snap = config.snap === false ? (v: any) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
        totalWidth, curX, distanceToStart, distanceToLoop, item, i;

    gsap.set(items, { // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
        xPercent: (i, el) => {
            let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px") as string);
            xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px") as string) / w * 100 + parseFloat(gsap.getProperty(el, "xPercent") as string));
            return xPercents[i];
        }
    });
    gsap.set(items, { x: 0 });
    totalWidth = items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + items[length - 1].offsetWidth * parseFloat(gsap.getProperty(items[length - 1], "scaleX") as string) + (parseFloat(config.paddingRight) || 0);
    for (i = 0; i < length; i++) {
        item = items[i];
        curX = xPercents[i] / 100 * widths[i];
        distanceToStart = item.offsetLeft + curX - startX;
        distanceToLoop = distanceToStart + widths[i] * parseFloat(gsap.getProperty(item, "scaleX") as string);
        tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
            .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
            .add("label" + i, distanceToStart / pixelsPerSecond);
        times[i] = distanceToStart / pixelsPerSecond;
    }
    function toIndex(index: number, vars: any) {
        vars = vars || {};
        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length); // always go in the shortest direction
        let newIndex = gsap.utils.wrap(0, length, index),
            time = times[newIndex];
        if (time > tl.time() !== index > curIndex) { // if we're wrapping the timeline's playhead, make the proper adjustments
            vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
            time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        curIndex = newIndex;
        vars.overwrite = true;
        return tl.tweenTo(time, vars);
    }
    tl.next = (vars: any) => toIndex(curIndex + 1, vars);
    tl.previous = (vars: any) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index: number, vars: any) => toIndex(index, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true); // pre-render for performance
    if (config.reversed) {
        tl.vars.onReverseComplete?.();
        tl.reverse();
    }
    return tl;
}

export default InfiniteSlider;
