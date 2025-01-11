const toggleButton = document.getElementById('toggleButton');
const introContent = document.getElementById('introContent');
const aboutContent = document.getElementById('aboutContent');
const contactContent = document.getElementById('contactContent');

const setInitialTheme = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '&#9728;': '&#9789;';
};

setInitialTheme();

toggleButton.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    toggleButton.style.backgroundColor = isDarkMode ? '#333': '#f0f0f0';
    toggleButton.innerHTML = isDarkMode ? '&#9728;': '&#9789;';
});

const setupNavigation = () => {
    const fadeElements = {
        intro: introContent,
        about: aboutContent,
        contact: contactContent,
    };

    const fadeOut = (element, callback) => {
        element.style.opacity = '1';
        element.style.transition = 'opacity 0.5s ease';
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            callback();
        }, 500);
    };

    const fadeIn = (element) => {
        element.style.display = 'block';
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 15);
    };

    document.getElementById('aboutLink').addEventListener('click', (e) => {
        e.preventDefault();
        fadeOut(postList, () => {
            fadeElements.intro.style.display = 'block';
            fadeElements.about.style.display = 'block';
            fadeElements.contact.style.display = 'none';
            fadeIn(fadeElements.intro);
        });
    });

    document.getElementById('contactLink').addEventListener('click', (e) => {
        e.preventDefault();
        fadeOut(postList, () => {
            fadeElements.intro.style.display = 'block';
            fadeElements.contact.style.display = 'block';
            fadeElements.about.style.display = 'none';
            fadeIn(fadeElements.intro);
        });
    });

    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        fadeOut(fadeElements.intro, () => {
            postList.style.display = 'block';
            fadeIn(postList);
        });
    });
};

setupNavigation();