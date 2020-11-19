const {Client} = require('pg');
require('dotenv').config()
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

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
            searchToUpdateStory(parentId);
            response.status(201).send(`Content child added with ID: ${insertId}`);
        });
    });
}

async function getStoryIdByContent(contentId) {
    let storyId;
    const rows = await client.query('select story_id from story_content where content_id = $1', [contentId]);

    if(rows.rows.length > 0) {
        storyId = rows.rows[0].story_id;
        if (!storyId) {
            return;
        }
        return storyId;
    }
}

async function searchToUpdateStory(parentId) {
    const rows = await client.query('select * from content_child where parent_id = $1', [parentId]);
    const contents = await rows.rows;

    if (!contents || contents.length !== 5) {
        return;
    }
    const storyId = await getStoryIdByContent(parentId);
    if(storyId) {
        await deleteStoryContent(storyId);
    } else {
        return;
    }

    for (const content of contents) {
        await client.query('insert into story_content(story_id, content_id) values ($1, $2)', [storyId, content.child_id]);
    }

    await client.query('update story set iteration = iteration + 1 where id = $1', [storyId]);

    client.query('delete from content_child where parent_id = $1', [parentId], (error, results) => {
        if (error) {
            throw error;
        }
    });

}

async function deleteStoryContent(storyId) {
    await client.query('delete from story_content where story_id = $1', [storyId]);
}


module.exports = {
    getStories,
    getStoryById,
    getEndedStories,
    getCurrentStories,
    getStoryContents,
    getContentChilds,
    createStory,
    addContentToNewStory,
    addContentChild
};
