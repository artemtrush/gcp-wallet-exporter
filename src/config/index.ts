import confme from 'confme';

const config = confme(
    `${__dirname}/config-env.json`,
    `${__dirname}/config-schema.json`
);

export default config;
