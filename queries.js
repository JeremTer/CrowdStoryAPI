const {Client} = require('pg');
require('dotenv').config()
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

/* Stories */
const getStories = (request, response) => {
    client.query('SELECT * FROM story', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
}

const getStoryById = (request, response) => {
    const id = parseInt(request.params.id)

    client.query('SELECT * FROM story WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
}

const getEndedStories = (request, response) => {
    const ite = parseInt(request.params.ite)

    client.query('SELECT * FROM story WHERE iteration = $1', [ite], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    })
}

const getCurrentStories = (request, response) => {
    const ite = parseInt(request.params.ite)

    client.query('SELECT * FROM story WHERE iteration < $1', [ite], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    })
}

const getStoryContents = (request, response) => {
    const id = parseInt(request.params.id)

    client.query('select content.* from content join story_content sc on content.id = sc.content_id where sc.story_id = $1;', [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    })
}

const getContentChilds = (request, response) => {
    const id = parseInt(request.params.id)

    client.query('select content.* from content join content_child cc on content.id = cc.child_id where cc.parent_id = $1;', [id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    })
}

const createStory = (request, response) => {
    const {name, theme} = request.body;

    client.query('INSERT INTO story (name, theme, iteration) VALUES ($1, $2, $3)', [name, theme, 0], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send();
    })
}

const addContentToNewStory = (request, response) => {
    const {text} = request.body;
    const storyId = parseInt(request.params.id);

    client.query('INSERT INTO content (text) VALUES ($1) RETURNING id', [text], (error, results) => {
        if (error) {
            throw error;
        }
        const insertId = results.rows[0].id;
        client.query('insert into story_content(story_id, content_id) values ($1, $2)', [storyId, insertId], (error, results) => {
            if (error) {
                throw error;
            }
            response.status(201).send(`Content added with ID: ${insertId}`);
        });
    });
}

const addContentChild = (request, response) => {
    const {text} = request.body;
    const parentId = parseInt(request.params.id);

    client.query('INSERT INTO content (text) VALUES ($1) RETURNING id', [text], (error, results) => {
        if (error) {
            throw error;
        }
        const insertId = results.rows[0].id;
        client.query('insert into content_child(parent_id, child_id) values ($1, $2)', [parentId, insertId], (error, results) => {
            if (error) {
                throw error;
            }
            response.status(201).send(`Content child added with ID: ${insertId}`);
        });
    });
}
/*
const updateStory = (request, response) => {
    const {storyId, contentId} = request.body;

    client.query('delete from story_content where story_id = $1', [storyId], (error, results) => {
        if (error) {
            throw error;
        }
        client.query('insert into story_content(story_id, content_id) values ($1, $2)', [storyId, contentId], (error, results) => {
            if (error) {
                throw error;
            }
            client.query('select iteration from story where id = $1', [storyId], (error, results) => {
                if (error) {
                    throw error;
                }
                console.log(results.rows[0])
                const iteration = results.rows[0].iteration + 1;
                client.query('update story set iteration = $1 where id = $2', [iteration, contentId], (error, results) => {
                    if (error) {
                        throw error;
                    }
                    response.status(201).send(`Story updated with ID: ${storyId}`);
                });
            });
        });
    });
}*/


module.exports = {
    getStories,
    getStoryById,
    getEndedStories,
    getCurrentStories,
    getStoryContents,
    getContentChilds,
    createStory,
    addContentToNewStory,
    addContentChild,
    //updateStory
};
