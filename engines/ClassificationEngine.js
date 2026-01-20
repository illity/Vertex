export class ClassificationEngine {
    constructor(content) {
        this.content = content;
        this.state = null;
        this.container = null;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    start(container) {
        this.container = container;
        const categories = Array.from(new Set(this.content.data.map(i => i.category)));

        const rows = this.content.data.map((item, idx) => ({
            id: idx.toString(),
            label: item.label,
            correctCategory: item.category,
            currentCategory: null,
            correct: null
        }));

        this.state = {
            categories,
            rows: this.shuffleArray(rows)
        };

        this.render(container);
    }

    render(container = this.container) {
        if (!container || !this.state) return;
        container.innerHTML = "";

        // --- Categorias ---
        const categoriesDiv = document.createElement("div");
        categoriesDiv.style.display = "flex";
        categoriesDiv.style.flexWrap = "wrap";
        categoriesDiv.style.gap = "12px";

        this.state.categories.forEach(cat => {
            const zoneDiv = document.createElement("div");
            zoneDiv.style.flex = "1";
            zoneDiv.style.minHeight = "120px";
            zoneDiv.style.border = "2px dashed #aaa";
            zoneDiv.style.padding = "8px";
            zoneDiv.style.borderRadius = "4px";
            zoneDiv.style.background = "#f9f9f9";

            const label = document.createElement("div");
            label.textContent = cat;
            label.style.fontWeight = "bold";
            label.style.marginBottom = "8px";
            zoneDiv.appendChild(label);

            const itemsInCategory = this.state.rows.filter(r => r.currentCategory === cat);
            itemsInCategory.forEach(r => {
                const itemDiv = document.createElement("div");
                itemDiv.textContent = r.label;
                itemDiv.style.padding = "4px 8px";
                itemDiv.style.margin = "2px 0";
                itemDiv.style.border = "1px solid #ccc";
                itemDiv.style.borderRadius = "4px";
                itemDiv.style.background =
                    r.correct === true ? "rgba(160, 230, 160, 0.6)" :
                        r.correct === false ? "rgba(246, 160, 160, 0.6)" : "#fff";
                zoneDiv.appendChild(itemDiv);
            });

            categoriesDiv.appendChild(zoneDiv);

            // Interact.js: tornar zona droppable
            interact(zoneDiv).dropzone({
                accept: '.draggable-item',
                overlap: 0.5,
                ondrop: event => {
                    const itemId = event.relatedTarget.dataset.id;
                    this.onDrop(itemId, cat);
                }
            });
        });

        container.appendChild(categoriesDiv);

        // --- Draggables ---
        const draggablesDiv = document.createElement("div");
        draggablesDiv.style.display = "flex";
        draggablesDiv.style.flexWrap = "wrap";
        draggablesDiv.style.marginTop = "12px";
        draggablesDiv.style.gap = "8px";

        const remainingItems = this.state.rows.filter(r => !r.currentCategory);

        remainingItems.forEach(r => {
            const itemDiv = document.createElement("div");
            itemDiv.textContent = r.label;
            itemDiv.classList.add("draggable-item"); // importante para Interact.js
            itemDiv.dataset.id = r.id;
            itemDiv.style.padding = "4px 8px";
            itemDiv.style.border = "1px solid #333";
            itemDiv.style.borderRadius = "4px";
            itemDiv.style.background = "#fff";
            itemDiv.style.cursor = "grab";

            draggablesDiv.appendChild(itemDiv);

            // Interact.js: tornar item arrastável
            interact(itemDiv).draggable({
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: container,
                        endOnly: true
                    })
                ],
                autoScroll: true,
                listeners: {
                    start: event => {
                        // Impede scroll da página enquanto arrasta
                        document.body.style.touchAction = 'none';
                    },
                    move: event => {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end: event => {
                        // Restaura scroll normal
                        document.body.style.touchAction = 'auto';

                        // Volta à posição original após soltar
                        event.target.style.transform = 'none';
                        event.target.removeAttribute('data-x');
                        event.target.removeAttribute('data-y');
                    }
                }
            });

        });

        container.appendChild(draggablesDiv);
    }

    onDrop(itemId, category) {
        const row = this.state.rows.find(r => r.id === itemId);
        if (!row) return;
        row.currentCategory = category;
        row.correct = row.correctCategory === category;
        this.render();
    }
}
