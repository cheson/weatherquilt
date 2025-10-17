import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './navigation.module.css';
import cx from 'classnames';

function Navigation() {
    const location = useLocation();
    
    return (
        <nav className={styles.nav}>
            <div className={styles.navContent}>
                <div className={styles.brand}>
                    <Link to="/" className={styles.brandLink}>
                        <span className={styles.brandIcon}>🧵</span>
                        <span className={styles.brandText}>Weather Quilt</span>
                    </Link>
                </div>
                <div className={styles.navLinks}>
                    <Link 
                        to="/" 
                        className={cx(styles.navLink, { [styles.active]: location.pathname === '/' })}
                    >
                        Home
                    </Link>
                    <Link 
                        to="/about" 
                        className={cx(styles.navLink, { [styles.active]: location.pathname === '/about' })}
                    >
                        About
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;

