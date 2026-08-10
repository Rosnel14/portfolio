const blogPosts = [

    {
        title: "My First BMS Design",
        date: "August 9, 2026",

        image: "assets/images/blog/bms-design.jpg",

        description:
            "Some thoughts about designing my first BMS board and the challenges I ran into.",

        link: "posts/bms-design.html"
    },

    {
        title: "Building an FSAE Shutdown Circuit",
        date: "August 1, 2026",

        image: "assets/images/blog/shutdown-circuit.jpg",

        description:
            "What I learned while designing and testing a shutdown circuit for Formula SAE.",

        link: "posts/fsae-shutdown.html"
    }

];


const blogContainer = document.getElementById("blogPosts");


blogPosts.forEach(post => {

    const article = document.createElement("article");

    article.className = "blog-card";

    article.innerHTML = `

        <img src="${post.image}" alt="${post.title}">

        <div class="blog-card-content">

            <p class="blog-date">
                ${post.date}
            </p>

            <h2>
                ${post.title}
            </h2>

            <p>
                ${post.description}
            </p>

            <a
                href="${post.link}"
                class="button primary"
            >
                Read Post →
            </a>

        </div>

    `;

    blogContainer.appendChild(article);

});