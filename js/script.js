const toggleButton = document.getElementById('toggleButton');
const postList = document.getElementById('postList');
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
    toggleButton.classList.add('rotate');

    setTimeout(() => toggleButton.classList.remove('rotate'), 600);
});

const getPostFileList = async () => {
    try {
        const response = await fetch('posts_list/list.txt');
        const text = await response.text();
        return text.split('\n').map(file => file.trim()).filter(Boolean);
    } catch (error) {
        console.error('获取帖子文件失败:', error);
        return [];
    }
};

const fetchPost = async (file) => {
    try {
        const response = await fetch(`posts/${file}`);
        if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
        const data = await response.text();
        return parsePost(data);
    } catch (error) {
        console.error(`获取帖子失败: ${file}`, error);
        return null;
    }
};

const parsePost = (text) => {
    const lines = text.split('\n').map(line => line.trim());
    const [title,
        meta,
        ...contentLines] = lines;

    return {
        title,
        meta,
        content: `<div class="footer-links">${marked.parse(contentLines.join('\n').trim())}</div>`
    };
};

const displayPosts = (posts) => {
    const postsPerPage = 4;
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    const showPage = (page) => {
        postList.style.transition = 'opacity 0.5s ease';
        postList.style.opacity = '0';

        setTimeout(() => {
            postList.innerHTML = '';
            const start = (page - 1) * postsPerPage;
            const end = start + postsPerPage;

            const fragment = document.createDocumentFragment();
            posts.slice(start, end).forEach((post, index) => {
                if (post) {
                    const postCard = document.createElement('div');
                    postCard.className = 'post-card';
                    postCard.onclick = () => toggleContent(start + index);
                    postCard.innerHTML = `
                    <h2>${post.title}</h2>
                    <p class="meta">${post.meta}</p>
                    <div class="content" id="content-${start + index}" style="display: none; opacity: 0; max-height: 0; transition: max-height 0.5s ease, opacity 0.5s ease;" data-fulltext="${encodeURIComponent(post.content)}"></div>
                    `;
                    fragment.appendChild(postCard);
                }
            });

            postList.appendChild(fragment);
            updatePagination(page);
            postList.style.opacity = '1';
        }, 500);
    };

    const updatePagination = (currentPage) => {
        pagination.innerHTML = '';

        const firstButton = createPaginationButton('首页', () => showPage(1));
        pagination.appendChild(firstButton);

        const pageButtons = [];
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            if (i <= totalPages) {
                const button = createPaginationButton(i, () => showPage(i));
                if (i === currentPage) button.classList.add('active');
                pageButtons.push(button);
            }
        }

        if (pageButtons.length === 0) {
            const fallbackButton = createPaginationButton('1', () => showPage(1));
            pageButtons.push(fallbackButton);
        }

        pageButtons.forEach(button => pagination.appendChild(button));

        if (totalPages > 1) {
            const lastButton = createPaginationButton('尾页', () => showPage(totalPages));
            pagination.appendChild(lastButton);
        }

        postList.appendChild(pagination);
    };

    const createPaginationButton = (text, onClick) => {
        const button = document.createElement('button');
        button.innerText = text;
        button.onclick = onClick;
        return button;
    };

    showPage(1);
};

let isAnimating = false;

const toggleContent = (index) => {
    const content = document.getElementById(`content-${index}`);
    const isVisible = content.style.maxHeight !== '0px';

    if (isAnimating) return;
    isAnimating = true;

    const toggleAnimation = (show) => {
        if (show) {
            content.style.display = 'block';
            const text = decodeURIComponent(content.getAttribute('data-fulltext'));
            content.innerHTML = text;

            const fullHeight = content.scrollHeight;
            content.style.maxHeight = `${fullHeight}px`;
            content.style.opacity = '1';

            const images = content.getElementsByTagName('img');
            let loadedImages = 0;

            const checkImagesLoaded = () => {
                loadedImages++;
                if (loadedImages === images.length) {
                    content.style.maxHeight = `${content.scrollHeight}px`;
                }
            };

            if (images.length === 0) {
                content.style.maxHeight = `${fullHeight}px`;
            } else {
                for (let img of images) {
                    img.onload = checkImagesLoaded;
                    img.onerror = checkImagesLoaded;
                }
            }
        } else {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.display = 'none';
            }, 500);
        }
    };

    toggleAnimation(!isVisible);
    setTimeout(() => {
        isAnimating = false;
    }, 500);
};

const loadPosts = async () => {
    const postFiles = await getPostFileList();
    const postsPromises = postFiles.map(fetchPost);
    const posts = await Promise.all(postsPromises);
    displayPosts(posts.filter(Boolean));
};

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
loadPosts();