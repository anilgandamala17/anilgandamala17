/**
 * Skip to main content link for accessibility
 * Allows keyboard users to skip navigation and go directly to main content
 */
export default function SkipToMain() {
    return (
        <a
            href="#main-content"
            className="skip-to-main"
            onClick={(e) => {
                e.preventDefault();
                const main = document.getElementById('main-content');
                if (main) {
                    main.focus();
                    main.scrollIntoView({ behavior: 'smooth' });
                }
            }}
        >
            Skip to main content
        </a>
    );
}
