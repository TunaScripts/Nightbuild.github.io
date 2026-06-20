// State Variables
let scriptsDatabase = [];

// DOM Elements
const grid = document.getElementById('scriptGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const modal = document.getElementById('modal');
const toast = document.getElementById('toast');

// Initialize Application
async function initApp() {
    try {
        const response = await fetch('scripts.json');
        if (!response.ok) throw new Error('Network response was not ok');
        scriptsDatabase = await response.json();
        renderScripts();
    } catch (error) {
        console.error('Failed to load scripts database:', error);
        grid.innerHTML = '<p style="color: #ef4444;">Error loading scripts. Ensure scripts.json exists.</p>';
    }
}

// Render Scripts to UI
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
            <div style="margin-top: 1rem; font-size: 0.8rem; color: #38bdf8;">
                Developer: ${script.author}
            </div>
        `;
        grid.appendChild(card);
    });
}

// Modal Interaction
function openModal(script) {
    document.getElementById('modalTitle').innerText = script.title;
    document.getElementById('modalMeta').innerText = `Category: ${script.category} | Developer: ${script.author}`;
    document.getElementById('modalDesc').innerText = script.description;
    document.getElementById('modalCode').innerText = script.code;
    
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

// Copy Code & Toast Notification
function copyCode() {
    const codeText = document.getElementById('modalCode').innerText;
    navigator.clipboard.writeText(codeText).then(() => {
        showToast();
    });
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Event Listeners
searchInput.addEventListener('input', renderScripts);
categoryFilter.addEventListener('change', renderScripts);
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('copyBtn').addEventListener('click', copyCode);

window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

// Boot up
initApp();
