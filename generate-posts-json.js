import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const postsDir = 'posts';
const outputFilePath = 'posts.json';
const postsListPath = 'posts_list/list.txt'; // Keep updating this for compatibility if needed, or remove later

async function generatePostsIndex() {
    try {
        console.log(`Scanning directory: ${postsDir}`);
        const files = await fs.readdir(postsDir);
        console.log(`Found files: ${files.join(', ')}`);

        const postsData = [];
        const postFileNames = []; // To update list.txt

        for (const filename of files) {
            // Skip hidden files like .DS_Store
            if (filename.startsWith('.')) {
                continue;
            }

            const filePath = path.join(postsDir, filename);
            const fileStat = await fs.stat(filePath);

            // Skip directories if any
            if (fileStat.isDirectory()) {
                continue;
            }

            console.log(`Processing file: ${filename}`);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const { data, content } = matter(fileContent); // Parse Front Matter

            // Basic validation: Ensure title exists
            if (!data.title) {
                console.warn(`Skipping ${filename}: Missing 'title' in Front Matter.`);
                continue;
            }

            // Use 'date' from Front Matter if available, otherwise use file modification time
            const date = data.date ? new Date(data.date) : fileStat.mtime;
            // Ensure meta exists, default to empty string if not provided
            const meta = data.meta || `作者: ${data.author || '未知'} | 日期: ${date.toISOString().split('T')[0]}`;

            postsData.push({
                title: data.title,
                meta: meta, // Keep meta for compatibility or use specific fields like date/author
                date: date.toISOString(), // Add standardized date for sorting
                author: data.author || '未知', // Add author field
                tags: data.tags || [], // Add tags field
                path: `${postsDir}/${filename}`, // Path to fetch the full content
                // Optional: Generate a short excerpt (first ~100 chars of content)
                excerpt: content.substring(0, 100).replace(/\n/g, ' ') + (content.length > 100 ? '...' : ''),
            });
            postFileNames.push(filename); // Add filename to list
        }

        // Sort posts by date, newest first
        postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`Writing ${postsData.length} posts to ${outputFilePath}`);
        await fs.writeFile(outputFilePath, JSON.stringify(postsData, null, 2));

        // --- Optional: Update list.txt for backward compatibility or other uses ---
        // If you decide you no longer need list.txt, you can remove this part.
        try {
            console.log(`Updating ${postsListPath}`);
            // Ensure the directory exists
            await fs.mkdir(path.dirname(postsListPath), { recursive: true });
            // Sort filenames consistently (e.g., alphabetically or based on sorted postsData)
            const sortedFileNames = postsData.map(p => path.basename(p.path));
            await fs.writeFile(postsListPath, sortedFileNames.join('\n'));
            console.log(`${postsListPath} updated successfully.`);
        } catch (listError) {
            console.error(`Error updating ${postsListPath}:`, listError);
        }
        // --- End Optional Part ---


        console.log('Posts index generated successfully!');

    } catch (error) {
        console.error('Error generating posts index:', error);
        process.exit(1); // Exit with error code
    }
}

generatePostsIndex();
