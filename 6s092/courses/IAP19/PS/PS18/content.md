# Readings 
[Recitation 9: Breadth-First Search](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_r09/) on OCW, section on Graph Representations (originally, Recitation 10 from Fall 2018)

[Lecture 9: Breadth-First Search](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec9/) on OCW, section on Graph Representations (originally, Lecture 10 from Fall 2018; note number changed: was 10, now 9)

# Graph Representation

<question multiplechoice>
csq_prompt = "Which of these are valid graphs $G = (V,E)$?"
csq_renderer = "checkbox"
csq_soln = [1,0,1]
csq_options =  [
"""```V = [0, 1, 2, 3]
E = [(0,1), (1,2), (0,3)]
```""",
"""```V = [0, 1, 2]
E = [(0,1), (1,2), (0,3)]
```""",
"""```V = [a, b, c]
E = [(a,b), (b,c), (a,c)]
```"""]
csq_explanation = "We can't have edges containing nodes outside of $V$"
</question>

The following questions all deal with this graph:

<center>
<img src="/_static/IAP19/relax7.png" height="200"  />
</center>

<question pythonliteral>
csq_prompt = "What is $V$? Express as a Python set of strings, like {'a', 'b'}."
csq_soln = {'a', 'b', 'c', 'd', 'v', 's'}
csq_explanation = "$V$ is the list of vertices in the graph."
</question>

<question pythonliteral>
csq_prompt = "Let's say we decide to represent $E$ with a dictionary. What is `E['s']`? Express as a Python set of strings, like {'a', 'b'}."
csq_soln = {'a', 'v'}
csq_explanation = "The dictionary value contains the set of all vertices $x$ such that $(s, x)$ is an edge in $G$"
</question>

<question pythonliteral>
csq_prompt = "How many different paths are there from $s$ to $v$ that do not contain a cycle?"
csq_soln = 2
csq_explanation = "We have the path `[s,a,b,c,v]` and `[s,v]`."
</question>


## Other relevant problems / further reading

- [OCW 6.006 Spring 2020 — Practice Problems](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/practice-problems/): problem sessions with worked examples and solutions.
  Most relevant: [Problem Session 5](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/problem-session-5/) — graph radius, graph schematics, full BFS, and full DFS.
- OCW 6.006 Spring 2020 — [Problem Set 5 Questions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps5_questions/) | [Solutions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps5_solutions/): graph representations, BFS, DFS, and shortest-path reductions
- [OCW 6.006 Spring 2020 — Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
