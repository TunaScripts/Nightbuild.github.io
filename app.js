// --- 1. FIREBASE INITIALIZATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "tuna-scripts.firebaseapp.com",
  projectId: "tuna-scripts",
  storageBucket: "tuna-scripts.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// --- 2. CORE LOGIC ---
let scriptsDatabase = [];
let currentScriptTitle = '';
let unsubscribeComments = null; // Used to stop listening to old comments when switching scripts

const grid = document.getElementById('scriptGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const modal = document.getElementById('modal');
const toast = document.getElementById('toast');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');

// Fetch scripts.json data
async function initApp() {
    try {
        const response = await fetch('scripts.json');
        scriptsDatabase = await response.json();
        renderScripts();
    } catch (error) {
        console.error('Failed to load scripts:', error);
    }
}

function renderScripts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    grid.innerHTML = '';

    const filteredScripts = scriptsDatabase.filter(script => {
        const matchesSearch = script.title.toLowerCase().includes(searchTerm) || script.description.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'All' || script.category === category;
        return matchesSearch && matchesCategory;
    });

    filteredScripts.forEach(script => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openModal(script);
        card.innerHTML = `
            <h3>${script.title}</h3>
            <div class="card-meta">
                <span class="tag">${script.category}</span>
                <span>⭐ ${script.rating}</span>
            </div>
            <p>${script.description}</p>
        `;
        grid.appendChild(card);
    });
}

// --- 3. MODAL & GLOBAL COMMENTS LOGIC ---
function openModal(script) {
    document.getElementById('modalTitle').innerText = script.title;
    document.getElementById('modalMeta').innerText = `Category: ${script.category} | Developer: ${script.author}`;
    document.getElementById('modalDesc').innerText = script.description;
    document.getElementById('modalCode').innerText = script.code;
    
    currentScriptTitle = script.title;
    modal.style.display = 'flex';
    
    listenToComments(currentScriptTitle);
}

function closeModal() {
    modal.style.display = 'none';
    if (unsubscribeComments) unsubscribeComments(); // Stop listening when closed
}

// Real-time listener for comments
function listenToComments(scriptTitle) {
    if (unsubscribeComments) unsubscribeComments();
    commentsList.innerHTML = '<p style="color: #94a3b8;">Loading comments...</p>';

    const commentsRef = collection(db, `comments_${scriptTitle}`);
    const q = query(commentsRef, orderBy("timestamp", "asc"));

    unsubscribeComments = onSnapshot(q, (snapshot) => {
        commentsList.innerHTML = '';
        if (snapshot.empty) {
            commentsList.innerHTML = '<p style="color: #94a3b8;">No comments yet. Be the first!</p>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-box';
            commentDiv.innerHTML = `
                <div class="comment-text">${data.text}</div>
                <button class="delete-btn" onclick="window.deleteGlobalComment('${docSnap.id}')">Delete</button>
            `;
            commentsList.appendChild(commentDiv);
        });
    });
}

// Add a comment to Firebase
document.getElementById('postCommentBtn').addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (!text || !currentScriptTitle) return;

    commentInput.value = ''; // Clear instantly for good UI
    
    try {
        await addDoc(collection(db, `comments_${currentScriptTitle}`), {
            text: text,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
});

// Delete a comment from Firebase
window.deleteGlobalComment = async function(docId) {
    try {
        await deleteDoc(doc(db, `comments_${currentScriptTitle}`, docId));
    } catch (e) {
        console.error("Error deleting document: ", e);
    }
}

// --- 4. UTILITIES ---
document.getElementById('copyBtn').addEventListener('click', () => {
    const codeText = document.getElementById('modalCode').innerText;
    navigator.clipboard.writeText(codeText).then(() => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    });
});

document.getElementById('closeModalBtn').addEventListener('click', closeModal);
searchInput.addEventListener('input', renderScripts);
categoryFilter.addEventListener('change', renderScripts);
window.onclick = (e) => { if (e.target === modal) closeModal(); }

initApp();
