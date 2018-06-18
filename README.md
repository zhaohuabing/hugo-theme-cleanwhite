# Clean White Theme for Hugo

CleanWhite is a clean, elegant, full functional blog theme for hugo. This is a live [demo site](https://zhaohuabing.com) using this theme.

It is based on [huxblog Jekyll Theme](https://github.com/Huxpro/huxpro.github.io)
and [Clean Blog Jekyll Theme](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll).
 
**Home**
![screenshot](https://raw.githubusercontent.com/zhaohuabing/hugo-theme-cleanwhite/master/images/fullscreenshot.png)

**Post**
![screenshot](https://raw.githubusercontent.com/zhaohuabing/hugo-theme-cleanwhite/master/images/post.png)

**Search**
![screenshot](https://raw.githubusercontent.com/zhaohuabing/hugo-theme-cleanwhite/master/images/search.png)

## Installation

Go to the directory where you have your Hugo site and run:

```
$ mkdir themes
$ cd themes
$ git clone https://github.com/zhaohuabing/hugo-cleanwhite-theme.git
```

If your site is already a git project, you may want to choose to add the cleanwhite theme as a submodule to avoid messing up your existing git repository.

```
$ mkdir themes
$ git submodule add https://github.com/zhaohuabing/hugo-theme-cleanwhite themes/hugo-theme-cleanwhite
```
For more information read the official [setup guide](https://gohugo.io/overview/installing/) of Hugo 

## Configuration
After installing the cleanwhite theme successfully, we recommend you to take a look at the [exampleSite](https://github.com/zhaohuabing/hugo-cleanwhite-theme/tree/master/exampleSite) directory. You will find a working Hugo site configured with the cleanwhite theme that you can use as a starting point for your site.

First, let's take a look at the [config.toml](https://github.com/zhaohuabing/hugo-cleanwhite-theme/tree/master/exampleSite/config.toml). It will be useful to learn how to customize your site. Feel free to play around with the settings.

### Comments
The optional comments system is powered by [Disqus](https://disqus.com). If you want to enable comments, create an account in Disqus and write down your shortname.

```toml
disqusShortname = "your-disqus-short-name"
```
You can disable the comments system by leaving the `disqusShortname` empty.

### Disqus in China
TBC

```toml
disqus_proxy = "http://yourdisqusproxy.com"
```

### Site Search with Algolia
Go to the directory where you have your Hugo site and run the following commands:
```bash
npm init
npm install atomic-algolia --save
```
Next, open up the newly created package.json, where we’ll add an NPM script to update your index at Algolia. Find "scripts", and add the following:
```josn
"algolia": "atomic-algolia"
```
Algolia index output format has already been supported by cleanwhite theme, so you can just build your site, then you’ll find a file called algolia.json in the root, which we can use to update your index in Algolia.
Generate index file:
```bash
hugo
```
Create a new file in the root of your Hugo project called .env, and add the following contents:
```bash
ALGOLIA_APP_ID={{ YOUR_APP_ID }}
ALGOLIA_ADMIN_KEY={{ YOUR_ADMIN_KEY }}
ALGOLIA_INDEX_NAME={{ YOUR_INDEX_NAME }}
ALGOLIA_INDEX_FILE={{ PATH/TO/algolia.json }}
```
Now you can push your index to Algolia by simply running:
```bash
npm run algolia
```
Add the following variables to your hugo site config so the search page can get access to algolia index data:
 ```toml
algolia_search = true
algolia_appId = {{ YOUR_APP_ID }}
algolia_indexName = {{ YOUR_INDEX_NAME }}
algolia_apiKey = {{ YOUR_ADMIN_KEY }}
```
Open search page in your browser: http://localhost:1313/search

### Google Analytics

You can optionally enable Google Analytics. Type your tracking code in the ``.

```toml
googleAnalytics = "UA-XXXXX-X"
```
Leave the `googleAnalytics` key empty to disable it.

### Baidu Analytics


### Nearly finished

In order to see your site in action, run Hugo's built-in local server.

```
$ hugo server
```

Now enter [`localhost:1313`](http://localhost:1313) in the address bar of your browser.

