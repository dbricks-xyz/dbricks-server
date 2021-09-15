module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        db: {
          cyan: '#0EECDD',
          yellow: '#FFF339',
          pink: '#FF68E7',
          purple: '#C400FF',
          gray: '#434951',

          lightcyan: '#bafff9',
          lightyellow: '#fffbd1',
          lightpink: '#ffccf6',
          lightpurple: '#eeb7ff',
          lightgray: '#8b929b',

          superlightgray: '#c6c9ce',
          darkcyan: '#2f605c',
          darkyellow: '#4f4c25',
          darkpink: '#472341',
          darkpurple: '#381f3f',
          darkgray: '#23272d',

          mango: '#F98505',
          serum: '#3FDBF0',
          saber: '#3F00FF',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
