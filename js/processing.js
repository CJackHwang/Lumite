const postList = document.getElementById('postList');
let allPosts = []; // Store all posts data from posts.json
let isAnimating = false;
const postsPerPage = 4; // Define how many posts per page

// --- New function to fetch the post index ---
const loadPostIndex = async () => {
    try {
        // Add cache busting query parameter to avoid stale data
        const response = await fetch(`posts.json?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        allPosts = await response.json();
        console.log(`Loaded ${allPosts.length} posts from index.`);
        displayPosts(1); // Display the first page initially
    } catch (error) {
        console.error('Failed to load post index:', error);
        postList.innerHTML = '<p style="color: red;">加载文章列表失败，请稍后重试或检查 posts.json 文件是否存在。</p>';
    }
};

// --- Modified displayPosts to handle pagination based on allPosts ---
const displayPosts = (page) => {
    const totalPages = Math.ceil(allPosts.length / postsPerPage);
    const paginationContainer = document.querySelector('.pagination') || document.createElement('div');
    paginationContainer.className = 'pagination';

    // Fade out effect for page transition
    postList.style.transition = 'opacity 0.3s ease';
    postList.style.opacity = '0';

    setTimeout(() => {
        // Clear only post cards, keep pagination if it exists
        const existingCards = postList.querySelectorAll('.post-card');
        existingCards.forEach(card => card.remove());

        const start = (page - 1) * postsPerPage;
        const end = start + postsPerPage;
        const postsToShow = allPosts.slice(start, end);

        const fragment = document.createDocumentFragment();
        postsToShow.forEach((post, index) => {
            const globalIndex = start + index; // Use global index for unique IDs
            if (post) {
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                // Pass the post path and global index to toggleContent
                postCard.onclick = () => toggleContent(globalIndex, post.path);
                postCard.innerHTML = `
                    <h2>${post.title}</h2>
                    <p class="meta">${post.meta}</p>
                    ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
                    <div class="content" id="content-${globalIndex}" style="display: none; opacity: 0; max-height: 0; transition: max-height 0.5s ease, opacity 0.5s ease;">
                        <p class="loading-indicator">正在加载文章内容...</p>
                    </div>
                `;
                fragment.appendChild(postCard);
            }
        });

        // Prepend new cards to postList
        postList.prepend(fragment);

        // Update or create pagination
        updatePagination(page, totalPages, paginationContainer);
        // Ensure pagination is at the end
        if (!postList.contains(paginationContainer)) {
            postList.appendChild(paginationContainer);
        }


        // Fade in new content
        postList.style.opacity = '1';
    }, 300); // Timeout matches the fade-out duration
};

// --- Modified updatePagination ---
const updatePagination = (currentPage, totalPages, paginationContainer) => {
    paginationContainer.innerHTML = ''; // Clear previous buttons

    if (totalPages <= 1) return; // No pagination needed for 1 or fewer pages

    // First Page Button
    if (currentPage > 1) {
        paginationContainer.appendChild(createPaginationButton('首页', () => displayPosts(1)));
    }

    // Previous Page Button
    if (currentPage > 1) {
         paginationContainer.appendChild(createPaginationButton('上一页', () => displayPosts(currentPage - 1)));
    }


    // Page Number Buttons (e.g., show current page and +/- 1)
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    if (startPage > 1) {
         paginationContainer.appendChild(createPaginationButton('...', () => displayPosts(startPage -1))); // Ellipsis if needed
    }


    for (let i = startPage; i <= endPage; i++) {
        const button = createPaginationButton(i, () => displayPosts(i));
        if (i === currentPage) button.classList.add('active');
        paginationContainer.appendChild(button);
    }

     if (endPage < totalPages) {
         paginationContainer.appendChild(createPaginationButton('...', () => displayPosts(endPage + 1))); // Ellipsis if needed
    }


    // Next Page Button
    if (currentPage < totalPages) {
        paginationContainer.appendChild(createPaginationButton('下一页', () => displayPosts(currentPage + 1)));
    }


    // Last Page Button
     if (currentPage < totalPages) {
        paginationContainer.appendChild(createPaginationButton('尾页', () => displayPosts(totalPages)));
     }
};

// --- Helper to create pagination buttons ---
const createPaginationButton = (text, onClick) => {
    const button = document.createElement('button');
    button.innerText = text;
    button.onclick = onClick;
    // Prevent button click from propagating to card click if inside postList
    button.addEventListener('click', (e) => e.stopPropagation());
    return button;
};

// --- Modified toggleContent to fetch content on demand ---
const toggleContent = async (index, postPath) => {
    const contentDiv = document.getElementById(`content-${index}`);
    if (!contentDiv) return;

    const isVisible = contentDiv.style.maxHeight !== '0px';
    const isLoading = contentDiv.classList.contains('loading');
    const isLoaded = contentDiv.classList.contains('loaded');

    if (isAnimating || isLoading) return; // Prevent multiple clicks during animation/loading

    isAnimating = true;

    if (!isVisible) { // Expand
        contentDiv.style.display = 'block'; // Make it visible for height calculation

        if (!isLoaded) { // Content not loaded yet, fetch it
            contentDiv.classList.add('loading');
            contentDiv.innerHTML = '<p class="loading-indicator">正在加载文章内容...</p>'; // Show loading indicator

            try {
                const response = await fetch(`${postPath}?t=${Date.now()}`); // Add cache busting
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const markdownText = await response.text();
                // Use gray-matter logic (or simple split) if Front Matter is still in the fetched file
                const fileContent = markdownText.includes('---') ? markdownText.split('---')[2] || markdownText : markdownText;
                // Render Markdown using marked.js
                contentDiv.innerHTML = `<div class="post-full-content">${marked.parse(fileContent.trim())}</div>`;
                contentDiv.classList.remove('loading');
                contentDiv.classList.add('loaded'); // Mark as loaded

                // Recalculate height after content is loaded
                const fullHeight = contentDiv.scrollHeight;
                contentDiv.style.maxHeight = `${fullHeight}px`;
                contentDiv.style.opacity = '1';

                // Adjust height again after images load (if any)
                const images = contentDiv.querySelectorAll('.post-full-content img');
                if (images.length > 0) {
                    let loadedImages = 0;
                    const checkImagesLoaded = () => {
                        loadedImages++;
                        if (loadedImages === images.length) {
                             // Use setTimeout to ensure rendering is complete
                            setTimeout(() => {
                                contentDiv.style.maxHeight = `${contentDiv.scrollHeight}px`;
                            }, 100);
                        }
                    };
                    images.forEach(img => {
                        if (img.complete) {
                            checkImagesLoaded();
                        } else {
                            img.onload = checkImagesLoaded;
                            img.onerror = checkImagesLoaded; // Count errors as loaded too
                        }
                    });
                }


            } catch (error) {
                console.error(`Failed to fetch post content: ${postPath}`, error);
                contentDiv.innerHTML = '<p style="color: red;">加载文章内容失败。</p>';
                contentDiv.classList.remove('loading');
                // Still expand to show the error message
                contentDiv.style.maxHeight = `${contentDiv.scrollHeight}px`;
                contentDiv.style.opacity = '1';
            }

        } else { // Content already loaded, just expand
            const fullHeight = contentDiv.scrollHeight;
            contentDiv.style.maxHeight = `${fullHeight}px`;
            contentDiv.style.opacity = '1';
        }

    } else { // Collapse
        contentDiv.style.maxHeight = '0';
        contentDiv.style.opacity = '0';
        // Don't hide immediately, wait for transition
        setTimeout(() => {
             if (contentDiv.style.maxHeight === '0px') { // Check if it's still collapsed
                 contentDiv.style.display = 'none';
             }
        }, 500); // Match CSS transition duration
    }

    // Reset animation flag after transition
    setTimeout(() => {
        isAnimating = false;
    }, 500); // Match CSS transition duration
};

// --- Initial load ---
// Add DOMContentLoaded listener to ensure elements exist
document.addEventListener('DOMContentLoaded', () => {
    // Check if marked is loaded, if not, maybe add a small delay or check periodically
    if (typeof marked === 'undefined') {
        console.warn('marked.min.js is not loaded yet. Retrying in 100ms.');
        setTimeout(loadPostIndex, 100);
    } else {
        loadPostIndex();
    }
});
