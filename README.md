# Clean White Theme for Hugo

CleanWhite is a clean, elegant, full functional blog theme for hugo.

It is based on [huxblog Jekyll Theme](https://github.com/Huxpro/huxpro.github.io)
and [Clean Blog Jekyll Theme](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll).

![screenshot](https://raw.githubusercontent.com/zhaohuabing/hugo-theme-cleanwhite/master/images/fullscreenshot.png)

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
BCT
```toml
algolia_search = true
algolia_appId = "WM4BEY1UDN"
algolia_indexName = "blog"
algolia_apiKey = "090c4a77b8bd4b8d2f2c1262afbc4be2"
```

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

