# Readings
[Lecture 1: Introduction](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec1/) on OCW, Sections on Efficiency, Asymptotic Notation, and Model of Computation (originally, Lecture notes 1 from Fall 2018)

[Recitation 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_r01/) on OCW, Sections on Asymptotic Notation, Model of Computation, and Efficiency Exercises (originally, Asymptotic Notation and Efficiency sections of Recitation notes 1, 6.006 Fall 2018 on Stellar)


# Asymptotics

## Big O Notation

We say that $f(n) \in O(g(n)$ if there exists $n_0$ and c such that for all $n>n_0$, $f(n) \le cg(n)$, where c is a positive constant.

It is common to write $f(n) = O(g(n))$ instead of $f(n) \in O(g(n))$. Both expressions have the same meaning.

Order the following functions such that if f is to the left of g, then $f(n) = O(g(n))$. Select all orderings that are correct (there may be more than one).

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [1,1,1]
csq_options =  ['$(n),\ (n+4),\ (5n)$',
 '$(n+4),\ (5n),\ (n)$',
 '$(5n),\ (n+4),\ (n)$']
</question>

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [1,1,0]
csq_options =  ['$(n),\ (n+4),\ (5n),\ (n^2),\ (n^2+n),\ (5n)^2$',
 '$(n+4),\ (5n),\ (n),\ (5n)^2,\ (n^2),\ (n^2+n)$',
 '$(n^2),\ (5n)^2,\ (n^2+n),\ (5n),\ (n),\ (n+4)$']
</question>


<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [0,1,0]
csq_options =  ['$(n\log(n)),\ (n),\ (n^2)$',
 '$(n),\ (n\log(n)),\ (n^2)$',
 '$(n),\ (n^2),\ n\log(n)$']
</question>

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [1,0,0]
csq_options =  ['$(n\log(n)),\ (n^{1.01}),\ (n^2)$',
 '$(n^{1.01}),\ (n\log(n)),\ (n^2)$',
 '$(n^{1.01}),\ (n^2),\ n\log(n)$']
</question>

<checkyourself>
Is ${n \choose 3} \in O(n^3)$? What about  $n^3 \in O({n \choose 3})$

</checkyourself>

## Big $\Omega$

We say that $f(n) \in \Omega(g(n)$ if there exists $n_0$ and c such that for all $n>n_0$, $cf(n) \ge g(n)$, where c is a positive constant.

Order the following functions such that if f is to the left of g, then $f(n) \in \Omega(g(n))$. Select all orderings that are correct.

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [1,1,1]
csq_options =  ['$(n),\ (n+4),\ (5n)$',
 '$(n+4),\ (5n),\ (n)$',
 '$(5n),\ (n+4),\ (n)$']
</question>

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [0,0,1]
csq_options =  ['$(n),\ (n+4),\ (5n),\ (n^2),\ (n^2+n),\ (5n)^2$',
 '$(n+4),\ (5n),\ (n),\ (5n)^2,\ (n^2),\ (n^2+n)$',
 '$(n^2),\ (5n)^2,\ (n^2+n),\ (5n),\ (n),\ (n+4)$']
</question>


<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [0,1,0]
csq_options =  ['$(n\log(n)),\ (n),\ (n^2)$',
 '$(n^2),\ (n\log(n)),\ (n)$',
 '$(n),\ (n^2),\ n\log(n)$']
</question>

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [0,0,1]
csq_options =  ['$(n\log(n)),\ (n^{1.01}),\ (n^2)$',
 '$(n^{1.01}),\ (n\log(n)),\ (n^2)$',
 '$(n^{2}),\ (n^{1.01}),\ n\log(n)$']
</question>


## $\Theta$

We say that $f(n) \in \Theta(g(n)$ if $f(n) \in O(g(n))$ and $f(n) \in \Omega(g(n)$

Choose the groups such that for any 2 functions in the groups, $f(n)$, $g(n)$, we have $f(n) \in \Theta(g(n)$

<question multiplechoice>
csq_renderer = "checkbox"
csq_soln = [1,1,0,0,0,1,0]
csq_options =  ['$(n),\ (n+4),\ (5n)$',
 '$(n\log_2(n)),\ (n\log_3(n)),\ (n\log_{10}(n))$',
 '$(n^2),\ (n^3),\ (n^4)$',
'$(n^{2^n}),\ (n^{2^{n+1}}),\ (n^{2^{n+2}})$',
'$(n^{\log_2(5)}),\ (n^{\log_3(5)}),\ (n^{\log_5(5)})$',
'$(2^n),\ (2^{n+1}),\ (2^{n+2})$',
'$(2^{2^n}),\ (2^{2^{n+1}}),\ (2^{2^{n+2}})$']
</question>


## Small $o$ and small $\omega$

We say that $f(n) \in o(g(n))$ if there exists $n_0$ and c such that for all $n>n_0$, $f(n) < cg(n)$, where c is a positive constant.

The only difference with $O$ is that now we have a strict inequality. This is the same as saying $$f(n) \in o(g(n)) \iff  f(n) \not \in \Omega(g(n))$$


Similarly,

$$f(n) \in \omega(g(n)) \iff  f(n) \not \in O(g(n))$$
## Other relevant problems / further reading

- [OCW 6.006 Spring 2020 — Practice Problems](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/practice-problems/): problem sessions with worked examples and solutions.
  Most relevant: [Problem Session 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/problem-session-1/) — asymptotic behavior of functions and double-ended sequence operations.
- OCW 6.006 Spring 2020 — [Problem Set 1 Questions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps1-questions/) | [Solutions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps1-solutions/): asymptotic ordering of functions, data structures, and doubly linked lists
- [OCW 6.006 Spring 2020 — Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
