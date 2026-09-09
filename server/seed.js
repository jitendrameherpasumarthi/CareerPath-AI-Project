const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Question = require("./models/Question");
const Course = require("./models/Course");

const questions = [
    // ================= PYTHON QUESTIONS (10) =================
    {
        skill: "Python",
        difficulty: "Easy",
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correctAnswer: "def",
        explanation: "In Python, functions are defined using the 'def' keyword followed by the function name and parameters."
    },
    {
        skill: "Python",
        difficulty: "Easy",
        question: "What is the output of type([1, 2, 3]) in Python?",
        options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'set'>"],
        correctAnswer: "<class 'list'>",
        explanation: "Square brackets define a list literal in Python."
    },
    {
        skill: "Python",
        difficulty: "Easy",
        question: "Which of the following data types in Python is immutable?",
        options: ["List", "Dictionary", "Tuple", "Set"],
        correctAnswer: "Tuple",
        explanation: "Tuples in Python cannot be changed after creation, making them immutable."
    },
    {
        skill: "Python",
        difficulty: "Medium",
        question: "What does the 'self' keyword represent in a Python class method?",
        options: [
            "The global scope",
            "The current instance of the class",
            "The parent class",
            "A static class variable"
        ],
        correctAnswer: "The current instance of the class",
        explanation: "'self' refers to the instance upon which a method is invoked."
    },
    {
        skill: "Python",
        difficulty: "Medium",
        question: "What is the result of [x**2 for x in range(4)]?",
        options: ["[0, 1, 4, 9]", "[1, 4, 9, 16]", "[0, 1, 2, 3]", "[1, 2, 4, 8]"],
        correctAnswer: "[0, 1, 4, 9]",
        explanation: "List comprehension evaluates x^2 for x = 0, 1, 2, 3 producing [0, 1, 4, 9]."
    },
    {
        skill: "Python",
        difficulty: "Medium",
        question: "Which built-in module is used to handle JSON data in Python?",
        options: ["json", "pyjson", "serialize", "jsonify"],
        correctAnswer: "json",
        explanation: "Python includes a standard 'json' library with json.loads() and json.dumps()."
    },
    {
        skill: "Python",
        difficulty: "Medium",
        question: "What is the purpose of the '__init__' method in Python classes?",
        options: [
            "To destroy an object",
            "Constructor method called when an object is instantiated",
            "To import dependencies",
            "To define private variables"
        ],
        correctAnswer: "Constructor method called when an object is instantiated",
        explanation: "'__init__' is the initializer method automatically invoked during object instantiation."
    },
    {
        skill: "Python",
        difficulty: "Hard",
        question: "What does a Python decorator function do?",
        options: [
            "Modifies or extends the behavior of another function without changing its source code",
            "Adds CSS styling to Python GUI components",
            "Deletes unused variables from memory",
            "Converts synchronous functions into async coroutines automatically"
        ],
        correctAnswer: "Modifies or extends the behavior of another function without changing its source code",
        explanation: "Decorators are callable objects that take a function as an argument and return an enhanced function."
    },
    {
        skill: "Python",
        difficulty: "Hard",
        question: "What is the difference between 'is' and '==' in Python?",
        options: [
            "'is' checks value equality, '==' checks object identity",
            "'==' checks value equality, 'is' checks object identity (same memory address)",
            "They are completely identical and interchangeable",
            "'is' can only be used with numbers"
        ],
        correctAnswer: "'==' checks value equality, 'is' checks object identity (same memory address)",
        explanation: "'==' checks if values are equal; 'is' verifies whether both variables refer to the exact same object in memory."
    },
    {
        skill: "Python",
        difficulty: "Hard",
        question: "How does a generator function differ from a normal function in Python?",
        options: [
            "Generators use 'yield' to produce items lazily one at a time, pausing execution",
            "Generators always run in multi-threaded mode",
            "Generators cannot take arguments",
            "Generators return all results simultaneously in a list"
        ],
        correctAnswer: "Generators use 'yield' to produce items lazily one at a time, pausing execution",
        explanation: "Generators yield values on demand while preserving execution state between yields."
    },

    // ================= JAVASCRIPT QUESTIONS (10) =================
    {
        skill: "JavaScript",
        difficulty: "Easy",
        question: "Which keyword creates a block-scoped variable in modern JavaScript?",
        options: ["var", "let", "global", "def"],
        correctAnswer: "let",
        explanation: "'let' and 'const' declare block-scoped variables, unlike 'var' which is function-scoped."
    },
    {
        skill: "JavaScript",
        difficulty: "Easy",
        question: "What is the result of typeof NaN in JavaScript?",
        options: ["'number'", "'nan'", "'undefined'", "'object'"],
        correctAnswer: "'number'",
        explanation: "In JavaScript, NaN (Not-a-Number) is technically of type 'number' according to the IEEE 754 floating-point standard."
    },
    {
        skill: "JavaScript",
        difficulty: "Easy",
        question: "Which method is used to add an item to the end of an array?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: "push()",
        explanation: "The push() method adds one or more elements to the end of an array and returns the new length."
    },
    {
        skill: "JavaScript",
        difficulty: "Medium",
        question: "What is the difference between '==' and '===' in JavaScript?",
        options: [
            "'==' performs type coercion, '===' checks both value and type strictly",
            "'===' performs type coercion, '==' is strict",
            "They are completely identical",
            "'===' is only for comparing objects"
        ],
        correctAnswer: "'==' performs type coercion, '===' checks both value and type strictly",
        explanation: "The strict equality operator (===) does not do type conversion before comparing."
    },
    {
        skill: "JavaScript",
        difficulty: "Medium",
        question: "What is a Closure in JavaScript?",
        options: [
            "A function having access to its parent lexical scope even after the parent function has closed",
            "A way to terminate a loop prematurely",
            "A syntax error in JSON",
            "A method to close browser tabs"
        ],
        correctAnswer: "A function having access to its parent lexical scope even after the parent function has closed",
        explanation: "A closure is the combination of a function bundled together with references to its surrounding state."
    },
    {
        skill: "JavaScript",
        difficulty: "Medium",
        question: "What does Promise.all() do when one of the passed promises rejects?",
        options: [
            "Immediately rejects with that reason, ignoring remaining promises",
            "Waits for all others to finish and resolves the fulfilled ones",
            "Converts the rejection into null",
            "Retries the rejected promise automatically"
        ],
        correctAnswer: "Immediately rejects with that reason, ignoring remaining promises",
        explanation: "Promise.all() has a fail-fast behavior: if any promise rejects, the entire returned promise rejects immediately."
    },
    {
        skill: "JavaScript",
        difficulty: "Medium",
        question: "Which array method creates a new array with all elements that pass a test condition?",
        options: ["filter()", "map()", "forEach()", "reduce()"],
        correctAnswer: "filter()",
        explanation: "filter() returns a new array with elements for which the callback returns truthy."
    },
    {
        skill: "JavaScript",
        difficulty: "Hard",
        question: "How does the JavaScript Event Loop handle the Microtask Queue vs Macrotask Queue?",
        options: [
            "All microtasks (e.g. Promises) are executed before the next macrotask (e.g. setTimeout) runs",
            "Macrotasks always execute with higher priority than microtasks",
            "They execute in alternating round-robin order",
            "Microtasks only execute when the page is unloaded"
        ],
        correctAnswer: "All microtasks (e.g. Promises) are executed before the next macrotask (e.g. setTimeout) runs",
        explanation: "After each macrotask completes, the engine exhausts the entire microtask queue before picking the next macrotask."
    },
    {
        skill: "JavaScript",
        difficulty: "Hard",
        question: "What is the purpose of 'Object.freeze()' vs 'Object.seal()'?",
        options: [
            "freeze() prevents addition, deletion, and modification of properties; seal() prevents addition/deletion but allows modifying existing properties",
            "seal() makes all values immutable while freeze() allows property deletion",
            "They are synonymous aliases",
            "freeze() only works on arrays"
        ],
        correctAnswer: "freeze() prevents addition, deletion, and modification of properties; seal() prevents addition/deletion but allows modifying existing properties",
        explanation: "Object.freeze() makes properties read-only, whereas Object.seal() allows existing writable properties to be changed."
    },
    {
        skill: "JavaScript",
        difficulty: "Hard",
        question: "What will 'console.log(1 + '2' + 3)' and 'console.log(1 + 2 + '3')' print respectively?",
        options: ["'123' and '33'", "'6' and '6'", "'15' and '33'", "'123' and '123'"],
        correctAnswer: "'123' and '33'",
        explanation: "1 + '2' converts to string '12' + 3 -> '123'. 1 + 2 adds to 3 + '3' -> '33'."
    },

    // ================= DSA QUESTIONS (10) =================
    {
        skill: "DSA",
        difficulty: "Easy",
        question: "What is the time complexity of accessing an element in an array by its index?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        correctAnswer: "O(1)",
        explanation: "Array elements are stored in contiguous memory locations, allowing constant-time O(1) random access."
    },
    {
        skill: "DSA",
        difficulty: "Easy",
        question: "Which data structure follows the Last-In, First-Out (LIFO) principle?",
        options: ["Stack", "Queue", "Linked List", "Binary Tree"],
        correctAnswer: "Stack",
        explanation: "A Stack inserts and removes items from the top, adhering to the LIFO principle."
    },
    {
        skill: "DSA",
        difficulty: "Easy",
        question: "Which data structure follows the First-In, First-Out (FIFO) principle?",
        options: ["Queue", "Stack", "Binary Heap", "Hash Table"],
        correctAnswer: "Queue",
        explanation: "A Queue enqueues at the rear and dequeues from the front (FIFO)."
    },
    {
        skill: "DSA",
        difficulty: "Medium",
        question: "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
        options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
        correctAnswer: "O(log n)",
        explanation: "In a balanced BST, each comparison halves the remaining search space, giving O(log n) time."
    },
    {
        skill: "DSA",
        difficulty: "Medium",
        question: "Which sorting algorithm has a worst-case time complexity of O(n log n)?",
        options: ["Merge Sort", "Quick Sort", "Bubble Sort", "Insertion Sort"],
        correctAnswer: "Merge Sort",
        explanation: "Merge Sort consistently divides the array into halves and merges in linear time, guaranteeing O(n log n) in all cases."
    },
    {
        skill: "DSA",
        difficulty: "Medium",
        question: "What technique is used in BFS (Breadth-First Search) graph traversal?",
        options: ["Queue", "Stack", "Recursion only", "Min-Heap"],
        correctAnswer: "Queue",
        explanation: "BFS explores nodes level by level using a FIFO Queue to keep track of discovered neighbors."
    },
    {
        skill: "DSA",
        difficulty: "Medium",
        question: "What is a Hash Collision?",
        options: [
            "When two different keys produce the same hash value/index in a hash table",
            "When memory runs out in a dynamic array",
            "When two threads access the same queue",
            "When a recursive call overflows the call stack"
        ],
        correctAnswer: "When two different keys produce the same hash value/index in a hash table",
        explanation: "A collision occurs when distinct keys map to the same bucket index via the hash function."
    },
    {
        skill: "DSA",
        difficulty: "Hard",
        question: "Which algorithm finds the shortest path between a single source and all other vertices in a weighted graph with non-negative edge weights?",
        options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Floyd-Warshall", "Tarjan's Algorithm"],
        correctAnswer: "Dijkstra's Algorithm",
        explanation: "Dijkstra's algorithm uses a priority queue / min-heap to compute single-source shortest paths in O((V + E) log V)."
    },
    {
        skill: "DSA",
        difficulty: "Hard",
        question: "What is the space complexity of Depth First Search (DFS) on a tree of maximum depth h?",
        options: ["O(h) for recursion stack", "O(n^2)", "O(1)", "O(2^h)"],
        correctAnswer: "O(h) for recursion stack",
        explanation: "The recursion stack in DFS stores at most the path from root to current leaf, taking O(h) space."
    },
    {
        skill: "DSA",
        difficulty: "Hard",
        question: "What data structure is typically used to efficiently implement a Priority Queue?",
        options: ["Binary Heap", "Doubly Linked List", "Queue", "Trie"],
        correctAnswer: "Binary Heap",
        explanation: "A binary min-heap or max-heap supports O(log n) insertions and O(log n) extract-min/max operations."
    }
];

const courses = [
    {
        courseId: "JavaScript Fundamentals",
        title: "JavaScript Fundamentals",
        icon: "🟨",
        description: "Master modern ECMAScript, closures, asynchronous patterns, DOM manipulation, and modern web application development.",
        level: "Beginner → Advanced",
        duration: "8 Weeks",
        priority: "High Priority",
        lessonsCount: 5,
        quizzesCount: 2,
        topics: [
            "Variables & Data Types",
            "Functions & Scope",
            "Arrays & Objects",
            "DOM Manipulation",
            "Async JavaScript & Promises"
        ]
    },
    {
        courseId: "DSA using Python",
        title: "DSA using Python",
        icon: "🐍",
        description: "Build robust algorithmic problem-solving skills covering lists, stacks, queues, trees, graphs, sorting, and dynamic programming.",
        level: "Beginner → Advanced",
        duration: "10 Weeks",
        priority: "High Priority",
        lessonsCount: 5,
        quizzesCount: 2,
        topics: [
            "Python Data Structures & Complexity",
            "Arrays, Linked Lists & Pointers",
            "Stacks & Queues",
            "Trees & Binary Search Trees",
            "Searching, Sorting & Graphs"
        ]
    },
    {
        courseId: "React Basics",
        title: "React Basics",
        icon: "⚛️",
        description: "Build modular, high-performance user interfaces with React components, hooks, state management, and modern routing.",
        level: "Intermediate",
        duration: "6 Weeks",
        priority: "Medium Priority",
        lessonsCount: 5,
        quizzesCount: 2,
        topics: [
            "React Introduction & JSX",
            "Components & Props",
            "State & useState Hook",
            "Lifecycle with useEffect",
            "Routing & API Integration"
        ]
    },
    {
        courseId: "DBMS",
        title: "DBMS",
        icon: "🗄️",
        description: "Understand relational databases, SQL queries, indexing, normalization, transactions, and ACID properties.",
        level: "Beginner → Intermediate",
        duration: "6 Weeks",
        priority: "Medium Priority",
        lessonsCount: 5,
        quizzesCount: 2,
        topics: [
            "Database Fundamentals & ER Modeling",
            "SQL Queries & DDL/DML",
            "Joins, Subqueries & Aggregations",
            "Normalization (1NF to BCNF)",
            "Transactions, ACID & Indexing"
        ]
    }
];

async function seedDatabase() {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");

        // Clear existing questions
        await Question.deleteMany({});
        console.log("Cleared existing questions.");

        const insertedQuestions = await Question.insertMany(questions);
        console.log(`✅ Seeded ${insertedQuestions.length} Assessment Questions successfully (10 Python, 10 JS, 10 DSA).`);

        // Clear and insert courses
        await Course.deleteMany({});
        const insertedCourses = await Course.insertMany(courses);
        console.log(`✅ Seeded ${insertedCourses.length} Courses successfully.`);

        console.log("🎉 Database seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error.message);
        process.exit(1);
    }
}

seedDatabase();
