# Readings 
[Lecture 3: Sorting](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec3/) on OCW, Section "Solving Recurrences" (introduces Substitution, Recurrence Tree, and Master Theorem; originally, Lecture notes from Fall 2018 — "Master Theorem")

[Recitation 3: Sorting](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_r03/) on OCW, Section "Master Theorem" (full Master Theorem exposition with all cases, polynomial simplification, and examples; originally, Recitation notes 2 from Fall 2018 — "Master Theorem")

[Recursion and Recursion Trees problem set](https://s092.xvm.mit.edu/IAP19/PS/PS02)

# Master Theorem

<question multiplechoice>
csq_prompt = "How many cases does the master theorem have?"
csq_renderer = "checkbox"
csq_soln = [0,0,1,0]
csq_options =  ['1',
'2',
'3',
'4']
csq_name="qexample1"
</question>

Calculate the recursions using the Master Theorem, and use the tightest asymptotic bound possible (i.e. if you can either put $O(n)$ or $\Theta(n)$).

<question expression>
csq_prompt = """$T(n) = T(n/2) + \\Theta(1)$

$T(n) =$ """
csq_show_check = True
csq_soln = ["Theta(log(n))"]
csq_explanation = "Case 2"
</question>

<question expression>
csq_prompt = """$T(n) = 2T(n/2) + O(n)$

$T(n) =$ """
csq_soln = ["O(n*log(n))"]
csq_explanation = "Case 2"
</question>

<question expression>
csq_prompt = """$T(n) = 4T(n/2) + \\Theta(n^2)$

$T(n) =$ """
csq_soln = ["Theta(n^2*log(n))"]
csq_explanation = "Case 2"
</question>


<question expression>
csq_prompt = """$T(n) = 9T(n/3) + O(n^2)$

$T(n) =$ """
csq_soln = ["O(n^2*log(n))"]
csq_explanation = "Case 2"
</question>

<question expression>
csq_prompt = """$T(n) = 8T(n/2) + \\Theta(n^3)$

$T(n) =$ """
csq_soln = ["Theta(n^3*log(n))"]
csq_explanation = "Case 2"
</question>




<question expression>
csq_prompt = """$T(n) = 2T(n/2) + \\Theta(n^2)$

$T(n) =$ """
csq_soln = ["Theta(n^2)"]
csq_explanation = "Case 3"
</question>


<question expression>
csq_prompt = """$T(n) = 8T(n/3) + O(n^2)$

$T(n) =$ """
csq_soln = ["O(n^2)"]
csq_explanation = "Case 3"
</question>

<question expression>
csq_prompt = """$T(n) = 4T(n/2) + O(n)$

$T(n) =$ """
csq_soln = ["Theta(n^2)"]
csq_explanation = "Case 1. Observe that it is Theta, and not O."
</question>

<question expression>
csq_prompt = """$T(n) = 8T(n/2) + \\Theta(n^2)$

$T(n) =$ """
csq_soln = ["Theta(n^3)"]
csq_explanation = "Case 1. Observe that it is Theta, and not O."
</question>


<question expression>
csq_prompt = """$T(n) = 27T(n/3) + O(n^2)$

$T(n) =$ """
csq_soln = ["Theta(n^3)"]
csq_explanation = "Case 1. Observe that it is Theta, and not O."
</question>

## Other relevant problems / further reading

- [OCW 6.006 Spring 2020 — Practice Problems](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/practice-problems/): problem sessions with worked examples and solutions.
  Most relevant: [Problem Session 2](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/problem-session-2/) — solving recurrences and the Master Theorem.
- OCW 6.006 Spring 2020 — [Problem Set 2 Questions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps2-questions/) | [Solutions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps2-solutions/): solving recurrences, sorting algorithm selection, and data structure design
- [OCW 6.006 Spring 2020 — Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
