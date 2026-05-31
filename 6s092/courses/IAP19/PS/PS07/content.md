# Readings 
[Lecture 2: Data Structures](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec2/) on OCW (originally, Lecture Notes 04 from Fall 2018 — "Data Structures")

<python>
csq_allow_check = True
csq_allow_submit = True
csq_allow_submit_after_answer_viewed = False
csq_nsubmits = None
</python>


# Data Structures Intuition

<question multiplechoice>
csq_prompt = "Which of these describes a 'sequence'?"
csq_renderer = "radio"
csq_soln = 'Interface'
csq_options = ['Interface', 'Algorithm', 'Data structure']
</question>

<question multiplechoice>
csq_prompt = "Which of these could be a valid data structure? Remember we are using the Word-RAM model of computation."
csq_renderer = "checkbox"
csq_soln = [1,0,0,1]
csq_options = ['An array', 'The prime numbers less than $300$', 'A frequency table', 'An array with a counter for the total number of elements that gets updated with insertions/deletions']
csq_explanation = "Arrays are just blocks of words according to the Word-RAM model. The last one also provides an operation on the data that is stored by an array."
</question>

<question multiplechoice>
csq_prompt = "Many children are entering Wumpus's cave, and none of them ever leave. Wumpus wants to keep track of how many kids have entered so far, and how tall the tallest child seen so far is. This describes:"
csq_renderer = "radio"
csq_soln = 'An interface'
csq_options = ['An interface', 'A data structure']
</question>

<question multiplechoice>
csq_prompt = "What are some valid data structures that would solve Wumpus's problem?"
csq_renderer = "checkbox"
csq_soln = [1, 1, 0, 0]
csq_options = ["Keeping the childrens' heights in an array, with an associated length and max functions that iterate over the array", "Keep track of length and max of the inputs seen so far, increment length every time and change max if we see a taller child", "Store a linked list of tuples that have the form $(height, pointer)$, where each pointer points at the next data point", "Plot the childrens' heights on a cartesian plane and use the horizontal line method to find where the maximum height is"]
</question>

<question multiplechoice>
csq_prompt = "Now Wumpus doesn't just want the tallest kid, but occasionally some authorities will come by and ask if Wumpus has seen a kid of some height $h$. Wumpus never lies, so now Wumpus wants to modify the interface so that it can find whether any children of that height have entered the cave. Is this a set interface or a sequence interface?"
csq_renderer = "radio"
csq_soln = "Set"
csq_options = ["Set", "Sequence"]
</question>

## Other relevant problems / further reading

- [OCW 6.006 Spring 2020 — Practice Problems](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/practice-problems/): problem sessions with worked examples and solutions.
  Most relevant: [Problem Session 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/problem-session-1/) — asymptotic behavior of functions and double-ended sequence operations.
- OCW 6.006 Spring 2020 — [Problem Set 1 Questions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps1-questions/) | [Solutions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps1-solutions/): asymptotic ordering of functions, data structures, and doubly linked lists
- [OCW 6.006 Spring 2020 — Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
