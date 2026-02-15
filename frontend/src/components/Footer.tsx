import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-links">
                    <a href="#">About</a>
                    <a href="#">Pro</a>
                    <a href="#">News</a>
                    <a href="#">Apps</a>
                    <a href="#">Year in Review</a>
                    <a href="#">Gifts</a>
                    <a href="#">Help</a>
                    <a href="#">Terms</a>
                    <a href="#">API</a>
                    <a href="#">Contact</a>
                </div>
                <div className="footer-social">
                    <a href="#" title="Instagram">📸</a>
                    <a href="#" title="Threads">🧵</a>
                    <a href="#" title="Twitter">🐦</a>
                    <a href="#" title="Facebook">📘</a>
                    <a href="#" title="TikTok">♪</a>
                    <a href="#" title="YouTube">📺</a>
                </div>
                <div className="footer-info">
                    <p>© Cinevault Limited. Made by fans in Aotearoa New Zealand. Movie data from <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
