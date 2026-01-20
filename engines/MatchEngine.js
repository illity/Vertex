export class MatchEngine {
  constructor(content, primaryKey) {
    this.content = content;
    this.primaryKey = primaryKey || 'primary';
    this.container = null;

    this.state = {
      columns: [],
      columnItems: {},
      correctMatches: {}
    };

    this.connections = [];
  }

  start(container) {
    this.container = container;
    if (!this.content?.data?.length) return;

    let keys = Object.keys(this.content.data[0]).filter(k => k != null);
    let otherCols = keys.filter(k => k !== this.primaryKey);

    let columns;
    if (otherCols.length === 2) columns = [otherCols[0], this.primaryKey, otherCols[1]];
    else if (otherCols.length === 1) columns = [this.primaryKey, otherCols[0]];
    else if (otherCols.length === 0) columns = [this.primaryKey];
    else columns = [this.primaryKey, ...otherCols];

    const columnItems = {};
    columns.forEach(col => {
      const vals = [];
      this.content.data.forEach(d => {
        if (d[col] != null && !vals.includes(d[col])) vals.push(d[col]);
      });
      columnItems[col] = vals;
    });

    const correctMatches = {};
    this.content.data.forEach(d => {
      const key = `${this.primaryKey}|${d[this.primaryKey]}`;
      correctMatches[key] = {};
      Object.keys(d).forEach(k => {
        if (k !== this.primaryKey) correctMatches[key][k] = d[k];
      });
    });

    this.state = { columns, columnItems, correctMatches };
    this.render();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  render() {
    const container = this.container;
    container.innerHTML = "";

    // SVG para linhas
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    container.appendChild(svg);
    this.svg = svg;

    // Colunas
    const columnsDiv = document.createElement("div");
    columnsDiv.style.display = "flex";
    columnsDiv.style.gap = "16px";
    columnsDiv.style.position = "relative";
    container.appendChild(columnsDiv);

    this.state.columns.forEach(col => {
      const colDiv = document.createElement("div");
      colDiv.style.flex = "1";
      colDiv.style.border = "2px dashed #aaa";
      colDiv.style.padding = "8px";
      colDiv.style.borderRadius = "4px";
      colDiv.style.minHeight = "200px";

      const label = document.createElement("div");
      label.textContent = col;
      label.style.fontWeight = "bold";
      label.style.marginBottom = "8px";
      colDiv.appendChild(label);

      const shuffledValues = this.shuffleArray([...this.state.columnItems[col]]);

      shuffledValues.forEach(val => {
        const itemDiv = document.createElement("div");
        itemDiv.textContent = val;
        itemDiv.style.padding = "4px 8px";
        itemDiv.style.margin = "2px 0";
        itemDiv.style.border = "1px solid #333";
        itemDiv.style.borderRadius = "4px";
        itemDiv.style.background = "#fff";
        itemDiv.style.cursor = "grab";

        itemDiv.classList.add("match-item");
        itemDiv.dataset.col = col;
        itemDiv.dataset.value = val;

        colDiv.appendChild(itemDiv);
      });

      columnsDiv.appendChild(colDiv);
    });

    this.initInteract(); // inicializa Interact.js nos elementos
  }

  initInteract() {
    const container = this.container;
    const svg = this.svg;

    let currentDrag = null;

    // Draggables
    container.querySelectorAll('.match-item').forEach(item => {
      interact(item).draggable({
        inertia: true,
        autoScroll: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: container,
            endOnly: true
          })
        ],
        listeners: {
          start: event => {
            currentDrag = {
              item,
              col: item.dataset.col,
              value: item.dataset.value,
              line: document.createElementNS("http://www.w3.org/2000/svg", "line")
            };
            const line = currentDrag.line;
            line.setAttribute("stroke", "black");
            line.setAttribute("stroke-width", "2");
            svg.appendChild(line);

            document.body.style.touchAction = 'none'; // impede pull-to-refresh
          },
          move: event => {
            const x = event.clientX;
            const y = event.clientY;

            const line = currentDrag.line;
            const rect = currentDrag.item.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            line.setAttribute("x1", rect.left + rect.width / 2 - svgRect.left);
            line.setAttribute("y1", rect.top + rect.height / 2 - svgRect.top);
            line.setAttribute("x2", x - svgRect.left);
            line.setAttribute("y2", y - svgRect.top);
          },
          end: event => {
            if (!currentDrag) return;

            // Descobre elemento alvo
            const touchX = event.clientX;
            const touchY = event.clientY;
            const dropEl = document.elementFromPoint(touchX, touchY);
            if (dropEl && dropEl.classList.contains('match-item') && dropEl.dataset.col !== currentDrag.col) {
              this.makeConnection(currentDrag.item, dropEl);
            }

            // Remove linha temporária se não conectou
            svg.removeChild(currentDrag.line);
            currentDrag = null;
            document.body.style.touchAction = 'auto'; // restaura scroll
            this.updateConnections();
          }
        }
      });
    });
  }

  makeConnection(fromItem, toItem) {
    const fromCol = fromItem.dataset.col;
    const fromVal = fromItem.dataset.value;
    const toCol = toItem.dataset.col;
    const toVal = toItem.dataset.value;

    let status = "wrong";
    if (fromCol === this.primaryKey) {
      const key = `${this.primaryKey}|${fromVal}`;
      console.log(fromCol, this.primaryKey, key)
      console.log(this.state.correctMatches[key])
      console.log(this.state.correctMatches[key][toCol], toVal)
      if (this.state.correctMatches[key] && this.state.correctMatches[key][toCol] == toVal) {
        status = "correct";
      }
    } else if (toCol === this.primaryKey) {
      const dataItem = this.content.data.find(d => d[this.primaryKey] == toVal);
      if (dataItem && dataItem[fromCol] == fromVal) status = "correct";
    }

    this.connections.push({
      from: { col: fromCol, value: fromVal },
      to: { col: toCol, value: toVal },
      status
    });
  }

  updateConnections() {
    const svg = this.svg;
    svg.innerHTML = "";

    const colIndex = {};
    this.state.columns.forEach((col, i) => colIndex[col] = i);

    this.connections.forEach(conn => {
      const fromEl = this.findItemElement(conn.from.col, conn.from.value);
      const toEl = this.findItemElement(conn.to.col, conn.to.value);
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      const fromIdx = colIndex[conn.from.col];
      const toIdx = colIndex[conn.to.col];

      const x1 = fromIdx < toIdx
        ? fromRect.right - svgRect.left
        : fromRect.left - svgRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;

      const x2 = fromIdx < toIdx
        ? toRect.left - svgRect.left
        : toRect.right - svgRect.left;
      const y2 = toRect.top + toRect.height / 2 - svgRect.top;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", conn.status === "correct" ? "green" : "red");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);

      const bg = conn.status === "correct" ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)";
      fromEl.style.background = bg;
      toEl.style.background = bg;
    });
  }

  findItemElement(col, value) {
    return this.container.querySelector(`[data-col="${col}"][data-value="${value}"]`);
  }
}
