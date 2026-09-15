import { TeachingStep } from '../../types';

export const reactBasicsSteps: TeachingStep[] = [
    // ========================================
    // PART 1: INTRODUCTION (10 minutes)
    // ========================================
    {
        id: 'rb-1',
        stepNumber: 1,
        title: 'Welcome to React',
        content: 'React is a JavaScript library for building user interfaces, created by Facebook in 2013. It uses a component-based architecture and a virtual DOM for efficient rendering.',
        spokenContent: 'Welcome to React Fundamentals! Over the next 50 minutes, we will master the core concepts of React, the most popular library for building modern web applications. Created by Facebook in 2013, React powers Instagram, Netflix, Airbnb, and thousands of other apps. By the end, you will understand components, state, props, hooks, and be ready to build your own React applications.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['React library', 'Component-based architecture', 'Virtual DOM', 'Declarative UI'],
        realWorldExamples: [
            'Facebook, Instagram, WhatsApp Web all use React',
            'Netflix uses React for its browser interface',
            'Airbnb rebuilt their front-end with React'
        ],
    },
    {
        id: 'rb-2',
        stepNumber: 2,
        title: 'Why React?',
        content: 'React solves key problems: complex DOM manipulation, state management, and code reusability. Its declarative approach means you describe what you want, not how to do it.',
        spokenContent: 'Why did React become so popular? Before React, managing complex UIs was painful. Developers had to manually update the DOM when data changed, leading to bugs and spaghetti code. React introduces a declarative approach: you describe what the UI should look like based on data, and React handles the DOM updates automatically. This leads to more predictable, maintainable code.',
        visualType: 'diagram',
        durationSeconds: 160,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Declarative programming', 'DOM abstraction', 'Predictable updates', 'One-way data flow'],
        practicalApplications: [
            'Easier debugging with predictable state flow',
            'Component reuse across projects',
            'Large ecosystem of tools and libraries'
        ],
    },
    {
        id: 'rb-3',
        stepNumber: 3,
        title: 'The Virtual DOM',
        content: 'React maintains a virtual DOM - a lightweight copy of the real DOM. When state changes, React compares virtual DOMs (diffing) and only updates what changed (reconciliation).',
        spokenContent: 'React\'s secret weapon is the Virtual DOM. When your data changes, React creates a new virtual DOM - a lightweight JavaScript representation of the UI. It then compares this new virtual DOM with the previous one, a process called diffing. React identifies exactly what changed and updates only those specific parts of the real DOM. This is called reconciliation with minimal DOM operations for maximum performance.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Virtual DOM', 'Diffing algorithm', 'Reconciliation', 'Minimal updates'],
    },

    // ========================================
    // PART 2: COMPONENTS (12 minutes)
    // ========================================
    {
        id: 'rb-4',
        stepNumber: 4,
        title: 'What are Components?',
        content: 'Components are independent, reusable pieces of UI. Think of them as custom HTML elements. Every React app is a tree of components, from a root App component down.',
        spokenContent: 'Components are React\'s building blocks. Think of them as custom HTML elements you create. A Button component, a Header component, a UserProfile component. Your entire app is a tree of components, starting from a root App component. Components can contain other components, forming a hierarchy. This modular approach makes code organized, reusable, and easy to reason about.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Component', 'Component tree', 'Modularity', 'Reusability'],
        realWorldExamples: [
            'A NavBar component used on every page',
            'A Card component reused for products, users, posts',
            'A Button component with consistent styling across the app'
        ],
    },
    {
        id: 'rb-5',
        stepNumber: 5,
        title: 'Functional Components',
        content: 'Modern React uses functional components - JavaScript functions that return JSX. They are simpler than class components and can use hooks for state and lifecycle.',
        spokenContent: 'In modern React, we use functional components. These are simply JavaScript functions that return JSX - the UI markup. No classes, no this keyword, just functions. They accept props as a parameter and return what should be displayed. With the introduction of hooks in 2019, functional components can do everything class components can, but with simpler, more readable code.',
        visualType: 'text',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
        keyConcepts: ['Functional component', 'Function returning JSX', 'Props parameter', 'No class required'],
    },
    {
        id: 'rb-6',
        stepNumber: 6,
        title: 'JSX Syntax',
        content: 'JSX is syntax that looks like HTML but is JavaScript. It gets compiled to React.createElement calls. Use curly braces {} to embed JavaScript expressions.',
        spokenContent: 'JSX looks like HTML but is actually JavaScript. When you write JSX, a compiler like Babel transforms it into React.createElement function calls. You can embed any JavaScript expression inside curly braces. Variables, function calls, calculations - anything that produces a value. JSX also has some differences from HTML: className instead of class, htmlFor instead of for, camelCase attributes.',
        visualType: 'text',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['JSX', 'Curly braces', 'className', 'Expressions in JSX'],
        subConcepts: ['self-closing tags', 'single root element', 'fragments'],
    },
    {
        id: 'rb-7',
        stepNumber: 7,
        title: 'Props: Passing Data',
        content: 'Props (properties) are how data flows from parent to child components. They are read-only - a child cannot modify props received from its parent.',
        spokenContent: 'Props, short for properties, are how we pass data between components. Data flows one way: from parent to child. When a parent renders a child component, it can pass data as props - just like HTML attributes. The child receives these props as an object parameter. Crucially, props are read-only. A child should never modify its props. This one-way data flow makes your app predictable and easier to debug.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Props', 'One-way data flow', 'Read-only', 'Parent to child'],
        practicalApplications: [
            'Pass user data to a Profile component',
            'Pass a callback function for child-to-parent communication',
            'Prop drilling through multiple levels'
        ],
    },

    // ========================================
    // PART 3: STATE AND HOOKS (15 minutes)
    // ========================================
    {
        id: 'rb-8',
        stepNumber: 8,
        title: 'State: Component Memory',
        content: 'State is data that belongs to a component and can change over time. When state updates, React re-renders the component to reflect the new data.',
        spokenContent: 'While props come from outside, state is a component\'s own data that can change. Think of state as component memory. A counter\'s current count, a form\'s input values, whether a modal is open - these are state. When state changes, React automatically re-renders the component. This reactivity is core to React\'s power. You update the data, React updates the UI.',
        visualType: 'diagram',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['State', 'Component memory', 'Re-render on change', 'Reactivity'],
    },
    {
        id: 'rb-9',
        stepNumber: 9,
        title: 'The useState Hook',
        content: 'useState is React\'s most important hook. It returns an array: [currentValue, setterFunction]. Always call hooks at the top level, not inside loops or conditions.',
        spokenContent: 'The useState hook lets functional components have state. Call useState with an initial value, and it returns an array with two items: the current state value and a function to update it. We typically use array destructuring: const [count, setCount] = useState(0). When you call setCount with a new value, React schedules a re-render. Important rules: only call hooks at the top level of your component, never inside loops, conditions, or nested functions.',
        visualType: 'text',
        durationSeconds: 220,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
        keyConcepts: ['useState', 'Hook', 'State variable', 'Setter function', 'Rules of hooks'],
    },
    {
        id: 'rb-10',
        stepNumber: 10,
        title: 'The useEffect Hook',
        content: 'useEffect handles side effects: data fetching, subscriptions, DOM manipulation. It runs after render. The dependency array controls when it re-runs.',
        spokenContent: 'useEffect is for side effects - things that happen outside React\'s render cycle. Fetching data from an API, setting up a subscription, manually changing the DOM. useEffect takes a function that runs after every render. You can return a cleanup function for when the component unmounts. The second argument is a dependency array: an empty array means run once on mount; with dependencies, it runs when those values change.',
        visualType: 'text',
        durationSeconds: 220,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 4,
        keyConcepts: ['useEffect', 'Side effects', 'Dependency array', 'Cleanup function', 'Mount and unmount'],
        practicalApplications: [
            'Fetch data when component mounts',
            'Set up and clean up event listeners',
            'Sync with external systems'
        ],
    },
    {
        id: 'rb-11',
        stepNumber: 11,
        title: 'Other Common Hooks',
        content: 'useContext for global state, useRef for DOM references and persistent values, useMemo and useCallback for performance optimization.',
        spokenContent: 'React provides more hooks for specific needs. useContext accesses values from React Context, avoiding prop drilling. useRef creates a mutable reference that persists across renders - useful for DOM access or storing values without triggering re-renders. useMemo memoizes expensive calculations, only recomputing when dependencies change. useCallback memoizes functions to prevent unnecessary re-renders of child components.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'advanced',
        estimatedMinutes: 3,
        keyConcepts: ['useContext', 'useRef', 'useMemo', 'useCallback', 'Memoization'],
    },

    // ========================================
    // PART 4: EVENTS AND FORMS (8 minutes)
    // ========================================
    {
        id: 'rb-12',
        stepNumber: 12,
        title: 'Handling Events',
        content: 'React events use camelCase naming (onClick, onChange). Event handlers are passed as functions, not strings. The event object is a SyntheticEvent wrapper.',
        spokenContent: 'Handling events in React is similar to HTML but with differences. Events use camelCase: onClick instead of onclick, onChange instead of onchange. You pass a function reference, not a string. React wraps browser events in SyntheticEvent objects for cross-browser consistency. Common pattern: define a handler function, then pass it to the event prop. For passing arguments, use an arrow function in the JSX.',
        visualType: 'text',
        durationSeconds: 180,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Event handlers', 'camelCase events', 'SyntheticEvent', 'onClick', 'onChange'],
    },
    {
        id: 'rb-13',
        stepNumber: 13,
        title: 'Controlled Components',
        content: 'In controlled components, form element values are controlled by React state. Every change updates state, and state drives the input value.',
        spokenContent: 'Controlled components are the React way of handling forms. The input\'s value is controlled by state, not by the DOM. You set value equals state variable, and onChange updates that state. This creates a two-way binding through React. Every keystroke updates state, which updates the input. This gives you full control: you can validate, transform, or restrict input in real-time. It also makes form data easily accessible.',
        visualType: 'diagram',
        durationSeconds: 200,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 3,
        keyConcepts: ['Controlled component', 'value prop', 'onChange handler', 'Single source of truth'],
    },

    // ========================================
    // PART 5: REVIEW & PRACTICE (5 minutes)
    // ========================================
    {
        id: 'rb-14',
        stepNumber: 14,
        title: 'Summary: Key Concepts',
        content: 'Review: Components are reusable UI pieces. Props flow down, state triggers re-renders. Hooks add functionality. Virtual DOM enables efficient updates.',
        spokenContent: 'Let us summarize React fundamentals. Components are the building blocks - functions that return JSX. Props pass data from parent to child, read-only. State is component memory that triggers re-renders when changed. Hooks like useState and useEffect add state and side effects to functional components. The virtual DOM enables efficient updates by minimizing real DOM manipulation. These concepts form the foundation for building any React application.',
        visualType: 'text',
        durationSeconds: 180,
        completed: false,
        complexity: 'basic',
        estimatedMinutes: 3,
    },
    {
        id: 'rb-15',
        stepNumber: 15,
        title: 'Practice: Build a Counter',
        content: 'Apply your knowledge by building a counter component with increment, decrement, and reset functionality.',
        spokenContent: 'Now let us practice! We will build a counter component together. It will display a number, with buttons to increment, decrement, and reset. This simple project uses everything we learned: functional components, JSX, useState, and event handlers.',
        visualType: 'interactive',
        durationSeconds: 240,
        completed: false,
        complexity: 'intermediate',
        estimatedMinutes: 4,
    },
];

// Total estimated duration: approximately 50 minutes
// Coverage: End-to-end from React basics to building components
