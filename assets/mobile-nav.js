(() => {
    function initMobileNav(nav, index) {
        const header = nav.closest('header');
        const desktopLinks = nav.querySelector('.md\\:flex.absolute');

        if (!header || !desktopLinks || nav.querySelector('.mobile-nav-toggle')) {
            return;
        }

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'mobile-nav-toggle';
        toggle.setAttribute('aria-label', 'Open navigation menu');

        const panelId = `mobile-nav-panel-${index}`;
        toggle.setAttribute('aria-controls', panelId);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="ri-menu-line" aria-hidden="true"></i>';

        const panel = document.createElement('div');
        panel.id = panelId;
        panel.className = 'mobile-nav-panel';
        panel.setAttribute('aria-hidden', 'true');

        const linksWrapper = document.createElement('div');
        linksWrapper.className = 'mobile-nav-links';

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'mobile-nav-actions';

        desktopLinks.querySelectorAll('a[href]').forEach((link) => {
            const cloned = document.createElement('a');
            cloned.href = link.getAttribute('href') || '#';
            cloned.textContent = (link.textContent || '').trim();
            if (link.title) {
                cloned.title = link.title;
            }
            linksWrapper.appendChild(cloned);
        });

        // Include the blog action in the mobile drawer.
        const blogLink = nav.querySelector('#nav-auth-area a[href$="blog.html"], a[href$="blog.html"]');
        if (blogLink) {
            const clonedBlogLink = document.createElement('a');
            clonedBlogLink.className = 'mobile-nav-action-link';
            clonedBlogLink.href = blogLink.getAttribute('href') || 'blog.html';
            clonedBlogLink.textContent = (blogLink.textContent || 'Blog').trim();
            actionsWrapper.appendChild(clonedBlogLink);
        }

        // Include sign-in action in the mobile drawer.
        const navSigninButton = nav.querySelector('#nav-signin-btn');
        if (navSigninButton) {
            const mobileSignInButton = document.createElement('button');
            mobileSignInButton.type = 'button';
            mobileSignInButton.className = 'mobile-nav-action-button';
            mobileSignInButton.innerHTML = '<i class="ri-user-line" aria-hidden="true"></i> Sign In';

            const syncSignInVisibility = () => {
                const isHidden = window.getComputedStyle(navSigninButton).display === 'none';
                mobileSignInButton.style.display = isHidden ? 'none' : 'inline-flex';
            };

            mobileSignInButton.addEventListener('click', () => {
                closePanel();
                navSigninButton.click();
            });

            syncSignInVisibility();
            const observer = new MutationObserver(syncSignInVisibility);
            observer.observe(navSigninButton, { attributes: true, attributeFilter: ['style', 'class'] });

            actionsWrapper.appendChild(mobileSignInButton);
        }

        panel.appendChild(linksWrapper);
        if (actionsWrapper.children.length > 0) {
            panel.appendChild(actionsWrapper);
        }

        const rightAnchor = nav.querySelector('#nav-auth-area, a[href$="blog.html"], a[href="../blog.html"]');
        if (rightAnchor && rightAnchor.parentElement === nav) {
            nav.insertBefore(toggle, rightAnchor);
        } else {
            nav.appendChild(toggle);
        }

        nav.appendChild(panel);

        const closePanel = () => {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation menu');
            toggle.innerHTML = '<i class="ri-menu-line" aria-hidden="true"></i>';
            document.body.classList.remove('mobile-nav-open');
        };

        const openPanel = () => {
            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Close navigation menu');
            toggle.innerHTML = '<i class="ri-close-line" aria-hidden="true"></i>';
            document.body.classList.add('mobile-nav-open');
        };

        toggle.addEventListener('click', () => {
            if (panel.classList.contains('open')) {
                closePanel();
            } else {
                openPanel();
            }
        });

        panel.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof HTMLElement && target.closest('a')) {
                closePanel();
            }
        });

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }
            if (!panel.classList.contains('open')) {
                return;
            }
            if (panel.contains(target) || toggle.contains(target)) {
                return;
            }
            closePanel();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && panel.classList.contains('open')) {
                closePanel();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1100) {
                closePanel();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('header nav').forEach((nav, index) => initMobileNav(nav, index));
    });
})();
