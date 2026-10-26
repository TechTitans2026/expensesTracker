let records = JSON.parse(localStorage.getItem("records")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) ||
    ["Food", "Travel", "Shopping", "Salary", "Education", "Other"];
let editId = null;

document.getElementById("date").valueAsDate = new Date();

function save() {
    localStorage.setItem("records", JSON.stringify(records));
    localStorage.setItem("categories", JSON.stringify(categories));
    update();
}

function updateCategories() {
    let select = document.getElementById("category");
    let manage = document.getElementById("manageCategory");

    select.innerHTML = "";
    manage.innerHTML = "";

    categories.forEach(c => {
        select.add(new Option(c, c));
        manage.add(new Option(c, c));
    });
}

function addCategory() {
    let c = document.getElementById("newCategory").value.trim();

    if (!c || categories.some(x => x.toLowerCase() === c.toLowerCase())) {
        alert("Enter a new category.");
        return;
    }

    categories.push(c);
    document.getElementById("newCategory").value = "";
    save();
}

function deleteCategory() {
    let c = document.getElementById("manageCategory").value;

    if (records.some(r => r.category === c)) {
        alert("This category is used in transactions.");
        return;
    }

    categories = categories.filter(x => x !== c);
    save();
}

document.getElementById("form").addEventListener("submit", function(e) {
    e.preventDefault();

    let description = document.getElementById("description").value.trim();
    let amount = Number(document.getElementById("amount").value);
    let date = document.getElementById("date").value;

    if (!description || amount <= 0 || !date) {
        alert("Enter valid transaction details.");
        return;
    }

    let record = {
        id: editId || Date.now(),
        description,
        amount,
        date,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value
    };

    if (editId !== null) {
        records = records.map(r => r.id === editId ? record : r);
        editId = null;
        document.querySelector("#form button").textContent = "Add Transaction";
    } else {
        records.push(record);
    }

    this.reset();
    document.getElementById("date").valueAsDate = new Date();
    save();
});

function editRecord(id) {
    let r = records.find(x => x.id === id);
    if (!r) return;

    document.getElementById("description").value = r.description;
    document.getElementById("amount").value = r.amount;
    document.getElementById("date").value = r.date;
    document.getElementById("type").value = r.type;
    document.getElementById("category").value = r.category;

    editId = id;
    document.querySelector("#form button").textContent = "Update Transaction";
    document.getElementById("form").scrollIntoView();
}

function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    if (editId === id) {
        editId = null;
        document.getElementById("form").reset();
        document.querySelector("#form button").textContent = "Add Transaction";
    }
    save();
}

function displayTransactions() {
    let search = document.getElementById("search").value.toLowerCase();
    let type = document.getElementById("filterType").value;
    let from = document.getElementById("fromDate").value;
    let to = document.getElementById("toDate").value;

    let filtered = records.filter(r =>
        (r.description.toLowerCase().includes(search) ||
         r.category.toLowerCase().includes(search)) &&
        (!type || r.type === type) &&
        (!from || r.date >= from) &&
        (!to || r.date <= to)
    );

    let tbody = document.getElementById("transactions");
    tbody.innerHTML = "";

    filtered.forEach(r => {
        let row = tbody.insertRow();

        [r.description, "₹" + r.amount, r.date, r.type, r.category]
            .forEach(value => row.insertCell().textContent = value);

        let actions = row.insertCell();
        let edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.onclick = () => editRecord(r.id);

        let del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = () => deleteRecord(r.id);

        actions.append(edit, del);
    });
}

function clearFilters() {
    document.getElementById("search").value = "";
    document.getElementById("filterType").value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    displayTransactions();
}

function update() {
    updateCategories();
    displayTransactions();

    let income = records.filter(r => r.type === "Income")
        .reduce((s, r) => s + r.amount, 0);

    let expenses = records.filter(r => r.type === "Expense")
        .reduce((s, r) => s + r.amount, 0);

    document.getElementById("income").textContent = income.toFixed(2);
    document.getElementById("expenses").textContent = expenses.toFixed(2);
    document.getElementById("balance").textContent = (income - expenses).toFixed(2);

    let month = new Date().toISOString().slice(0, 7);
    let monthly = records.filter(r => r.date.startsWith(month));

    let mi = monthly.filter(r => r.type === "Income")
        .reduce((s, r) => s + r.amount, 0);

    let me = monthly.filter(r => r.type === "Expense")
        .reduce((s, r) => s + r.amount, 0);

    document.getElementById("monthly").textContent =
        "Income: ₹" + mi.toFixed(2) +
        " | Expenses: ₹" + me.toFixed(2) +
        " | Balance: ₹" + (mi - me).toFixed(2);

    drawChart();
}

function drawChart() {
    let canvas = document.getElementById("chart");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let totals = {};

    records.filter(r => r.type === "Expense").forEach(r => {
        totals[r.category] = (totals[r.category] || 0) + r.amount;
    });

    let entries = Object.entries(totals);
    let max = Math.max(1, ...entries.map(e => e[1]));

    entries.forEach(([category, amount], i) => {
        let y = 15 + i * 35;
        if (y + 25 > canvas.height) return;

        ctx.fillStyle = "#287a65";
        ctx.fillRect(110, y, amount / max * 200, 20);

        ctx.fillStyle = "#222";
        ctx.font = "12px Arial";
        ctx.fillText(category, 5, y + 15);
        ctx.fillText("₹" + amount.toFixed(0),
            Math.min(315, 115 + amount / max * 200), y + 15);
    });
}

document.getElementById("search").addEventListener("input", displayTransactions);
document.getElementById("filterType").addEventListener("change", displayTransactions);

update();
