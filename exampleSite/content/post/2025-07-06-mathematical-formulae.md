---
layout:     post
title:      "Authoring mathematical formulae"
description: "Cleanwhite theme now has built-in support for authoring mathematical or chemical equations"
excerpt: "The theme uses Hugo's embedded instance of the KaTeX display engine to render mathematical markup to HTML at build time."
date:    2025-07-06
author: "Andreas Deininger"
image: "/img/2018-05-23-service_2_service_auth/background.jpg"
publishDate: 2025-07-06
tags:
    - Math
    - KaTeX 
URL: "/2025/07/06/mathematical-formulae/"
categories: [ tips ]    
---

## Authoring mathematical and chemical equations


Cleanwhite theme now has built-in \(\KaTeX\) support, so that you can easily include
complex mathematical formulae into your web page, either inline or centred
on its own line. The theme uses Hugo's embedded instance of the KaTeX 
display engine to render mathematical markup to HTML at build time.
With this server side rendering of formulae, the same output is produced,
regardless of your browser or your environment.  

[\(\LaTeX\)](https://www.latex-project.org/) is a high-quality typesetting
system for the production of technical and scientific documentation. Due to its
excellent math typesetting capabilities, \(\TeX\) became the de facto standard
for the communication and publication of scientific documents, especially if
these documents contain a lot of mathematical formulae. Designed and mostly
written by Donald Knuth, the initial version was released in 1978. Dating back
that far, \(\LaTeX\) has `pdf` as its primary output target and is not
particularly well suited for producing HTML output for the Web. Fortunately,
with [\(\KaTeX\)](https://katex.org/) there exists a fast and easy-to-use
JavaScript library for \(\TeX\) math rendering on the web, which is embedded
into Hugo as of Hugo version v0.132.0.

As already mentioned above, mathematical or chemical equations can be shown either inline or in display mode:

### Inline formulae

The following code sample produces a text line with three inline formulae:

```tex
When \(a \ne 0\), there are two solutions to \(ax^2 + bx + c= 0\) and they are \(x = {-b \pm \sqrt{b^2-4ac} \over 2a}\).
```

When \(a \ne 0\), there are two solutions to \(ax^2 + bx + c= 0\) and they are
\(x = {-b \pm \sqrt{b^2-4ac} \over 2a}\).

### Formulae in display mode

The following code sample produces an introductory text line followed by a
formula numbered as `(1)` residing on its own line:

````markdown
The probability of getting \(k\) heads when flipping \(n\) coins is:
\[
\tag*{(1)} P(E) = {n \choose k} p^k (1-p)^{n-k}
\]
````

As an alternative to the standard syntax used above, formulae can also be
authored using a [GLFM math block](https://docs.gitlab.com/ee/user/markdown.html#math):

````markdown
The probability of getting \(k\) heads when flipping \(n\) coins is:

```math
\tag*{(1)} P(E) = {n \choose k} p^k (1-p)^{n-k}
```
````

Both standard syntax and `math` block render to the same formula:

The probability of getting \(k\) heads when flipping \(n\) coins is:

```math
\tag*{(1)}  P(E) = {n \choose k} p^k (1-p)^{n-k}
```

This [wiki page](https://en.wikibooks.org/wiki/LaTeX/Mathematics) provides in-depth
information about typesetting mathematical formulae using the \(\LaTeX\)
typesetting system.

### Activating KaTeX support

#### Enable `passthrough` extension

All you have to do is to enable and configure the goldmark `passthrough` extension
inside your `hugo.toml`/`hugo.yaml`/`hugo.json`. You may want to edit the definition of the delimiters to
meet your own needs. For details, see the official
[Hugo docs](https://gohugo.io/content-management/mathematics/#step-1).

```toml
[markup]
  [markup.goldmark]
    [markup.goldmark.extensions]
      [markup.goldmark.extensions.passthrough]
        enable = true
        [markup.goldmark.extensions.passthrough.delimiters]
          block = [['\[', '\]'], ['$$', '$$']]
          inline = [['\(', '\)']]
```

Internally, cleanwhite theme creates and uses Hugo's `render-passthrough`
[hook](https://gohugo.io/render-hooks/passthrough/) when generating math
equations at build-time. This hook is part of the theme, no need for any user action.

#### Media types for download of KaTeX fonts

Just for your information, no need for any action from you as user:
KaTeX brings its own font files for rendering mathematical formulae.
In order to enable the download of these font files locally during build time, two
additional [media types](https://gohugo.io/configuration/media-types/#create-a-media-type)
had to be created by adding the lines below to the `hugo.toml` configuration file of the cleanwhite theme:

```toml
mediaTypes:
  font/woff:
    suffixes:
    - woff
  font/woff2:
    suffixes:
    - woff2
```


With the `passthrough` extension enabled and the media types defined, support
of \(\KaTeX\) is automatically enabled when you author a `math` code block on
your page or when you add a mathematical formula to your page using one of the
passthrough delimiter pairs defined above.

### Display of Chemical Equations and Physical Units

[mhchem](https://www.ctan.org/pkg/mhchem) is a \(\LaTeX\) package for
typesetting chemical molecular formulae and equations. Fortunately, \(\KaTeX\)
provides the `mhchem`
[extension](https://github.com/KaTeX/KaTeX/tree/main/contrib/mhchem) that makes
the `mhchem` package accessible when authoring content for the web. As of hugo
version v0.144.0, the `mhchem` extension is enabled in Hugo's embedded KaTeX
instance by default, therefore you can easily include chemical equations into
your page. An equation can be shown either inline or can reside on its own line.
The following code sample produces a text line including an inline chemical
equation:

```mhchem
*Precipitation of barium sulfate:* \(\ce{SO4^2- + Ba^2+ -> BaSO4 v}\)
```

_Precipitation of barium sulfate:_ \(\ce{SO4^2- + Ba^2+ -> BaSO4 v}\)

More complex equations can be displayed on their own line using the block
delimiters defined:

<!-- prettier-ignore-start -->
````markdown
\[
\tag*{(2)} \ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteric hydroxide}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{tetrahydroxozincate}}{\ce{[Zn(OH)4]^2-}}$}
\]
````
<!-- prettier-ignore-end -->

Alternatively, you can use a code block adorned with `chem` in order to render
the equation:

````markdown
```chem
\tag*{(2)} \ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteric hydroxide}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{tetrahydroxozincate}}{\ce{[Zn(OH)4]^2-}}$}
```
````

Both standard syntax and `chem` block renders to the same equation:

<!-- prettier-ignore-start -->
\[
\tag*{(2)} \ce{Zn^2+  <=>[+ 2OH-][+ 2H+]  $\underset{\text{amphoteric hydroxide}}{\ce{Zn(OH)2 v}}$  <=>[+ 2OH-][+ 2H+]  $\underset{\text{tetrahydroxozincate}}{\ce{[Zn(OH)4]^2-}}$}
\]
<!-- prettier-ignore-end -->

The [manual](https://mhchem.github.io/MathJax-mhchem/) for mchem’s input syntax
provides in-depth information about typesetting chemical formulae and physical
units using the `mhchem` tool.

Use of `mhchem` is not limited to the authoring of chemical equations. By using
the included `\pu` command, pretty looking physical units can be written with
ease, too. The following code sample produces two text lines with four numbers
plus their corresponding physical units:

```mhchem
* Scientific number notation: \(\pu{1.2e3 kJ}\) or \(\pu{1.2E3 kJ}\) \\
* Divisions: \(\pu{123 kJ/mol}\) or \(\pu{123 kJ//mol}\)
```

- Scientific number notation: \(\pu{1.2e3 kJ}\) or \(\pu{1.2E3 kJ}\)
- Divisions: \(\pu{123 kJ/mol}\) or \(\pu{123 kJ//mol}\)

For a complete list of options when authoring physical units, have a look at the
[section](https://mhchem.github.io/MathJax-mhchem/#pu) on physical units in the
`mhchem` documentation.
