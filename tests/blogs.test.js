const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

afterEach(async () => {
    await page.close();
});

describe('When logged in', async () => {
    beforeEach(async () => {
        await page.login();
        await page.click('a.btn-floating');
    });

    test('can see blog create form', async () => {
        const label = await page.$eval('form label', el => el.innerHTML);

        expect(label).toEqual('Blog Title');
    });

    describe('And using valid inputs', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'My Title');
            await page.type('.content input', 'My Content');
            await page.click('form button');
        });

        test('Submitting takes user to review screen', async () => {
            const text = await page.$eval('h5', el => el.innerHTML);

            expect(text).toEqual('Please confirm your entries');
        });

        test('Submitting then saving adds blog to index page', async () => {
            await page.click('button.green');
            await page.waitFor('.card');

            const title = await page.$eval('.card-title', el => el.innerHTML);
            const content = await page.$eval('p', el => el.innerHTML);

            expect(title).toEqual('My Title');
            expect(content).toEqual('My Content');
        });
    });

    describe('And using invalid inputs', async () => {
        beforeEach(async () => {
            await page.click('form button');
        });

        test('the form shows an error message', async () => {
            const titleError = await page.$eval('.title .red-text', el => el.innerHTML);
            const contentError = await page.$eval('.content .red-text', el => el.innerHTML);

            expect(titleError).toEqual('You must provide a value');
            expect(contentError).toEqual('You must provide a value');
        });
    });
});

describe('User is not logged in', async () => {
    const actions = [{
            method: 'get',
            path: '/api/blogs'
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: {
                title: 'T',
                content: 'C'
            }
        }
    ];

    test('Blog related actions are prohibited', async () => {
        const results = await page.execRequests(actions);

        for (let result of results) {
            expect(result).toEqual({
                error: 'You must log in!'
            });
        }
    });
});