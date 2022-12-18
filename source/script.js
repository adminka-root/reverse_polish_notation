cl = function() { // console.log() = cl()
    return console.log.apply(console, arguments);
}

function Onload() {
    // глобальные переменные
    operators = {
        '(':  0,
        ')':  1,
        'V':  2,
        '&':  3,
        '¬':  4,
        '>':  5,
        '<':  5,
        '===': 5,
        '==': 5,
        '=': 5,
        '>=': 5,
        '<=': 5,
        '+':  6,
        '-':  6,
        '*':  7,
        '/':  7,
        '^':  8
    };

}

function parsing_the_input_str_into_constituent_elements(input_line, input_operators) {
    max_operator_length = 3  // symbols
    let remember_symbols = ''
    detected_operators = {};

    /*
        Создает detected_operators вида
        {
            'индекс_1': {  // от
                'operator': обнаж. оператор,
                'to': индекс_2  // до включая
            }
            ...
        }
        Т.о. мы фиксируем, начиная от максимально длинных операторов,
        соответствующие совпадения
    */
    for (let loop_sm = max_operator_length; loop_sm > 0; loop_sm--) {
        for (let y = 0; y <= input_line.length - loop_sm; y++) {
            if (typeof(detected_operators[y]) === "undefined") {
                remember_symbols = input_line.slice(y, y+loop_sm)
                if (typeof(input_operators[remember_symbols]) !== "undefined") {
                    detected_operators[y] = {'operator': remember_symbols, 'to': y+loop_sm-1 }
                    y += loop_sm - 1
                }
            }
            else {
                y = detected_operators[y]['to']
            }
        }
    }

    let input_expression_queue = [];
    let operand = ''
    for (let y = 0; y < input_line.length; y++) {
        if (typeof(detected_operators[y]) !== "undefined") {
            if (operand !== '') {
                input_expression_queue.push(operand)
                operand = ''
            }
            input_expression_queue.push(detected_operators[y]['operator'])
            y = detected_operators[y]['to']
        }
        else {
            operand += input_line[y]
        }
    }
    if (operand !== '') { input_expression_queue.push(operand) }

    // В целом, можно было бы изначально сравнивать посимвольно, мол
    // если это не число и не символ, то это оператор
    // но тогда концептуально мы не смогли бы добавить
    // в список приоритетов выражения типа 'not' 'and' и т.п.
    // а сейчас - можем :)
    cl(detected_operators)
    return input_expression_queue.reverse()
}


function StartAnalysis() {
    result_table = new TableOfPolsk(
        document.querySelector('.result_table')
    );

    let input_expression =
        document.getElementById('math_express').value.replace(/ /g, '');

    if (input_expression.length === 0) {
        return false;
    }

    count_of_opening_brackets =
        input_expression.length - input_expression.replace(/\(/g, "").length;

    count_of_closing_brackets =
        input_expression.length - input_expression.replace(/\)/g, "").length;

    document.querySelector('.label_3').innerText = '';
    if (count_of_opening_brackets !== count_of_closing_brackets) {
        document.querySelector('.label_3').innerText =
            `Ошибка! Число открывающих (${count_of_opening_brackets}) и \
             закрывающих (${count_of_closing_brackets}) скобок различно!`;
        return false;
    }

    cl(); cl(input_expression);
    input_expression =
      parsing_the_input_str_into_constituent_elements(
          input_expression,
          operators
      );  // словарь в обратном порядке
    cl(input_expression.slice().reverse())

    let result_expression = '';
    let stack = [];
    let top_symbol = ''  // для stack.pop()

    while (true) {
        const symbol = input_expression.pop();  // считываем символ
        if (typeof(symbol) === "undefined") {
            break
        }

        // если symbol ∈ к {operators}
        if (typeof(operators[symbol]) !== "undefined") {
            if (stack.length === 0 || symbol === '(') {
                stack.push(symbol);
                result_table.add_Tbody_Line(
                    symbol,
                    result_table.oper_message['to_stack'],
                    stack,
                    result_expression
                );
            }
            else if (symbol === ')') {
                top_symbol = stack.pop();
                while ( (stack.length > 0) && (top_symbol !== '(') ) {
                    result_expression += top_symbol + ' ';
                    top_symbol = stack.pop();
                }
                result_table.add_Tbody_Line(
                    symbol,
                    result_table.oper_message['if_)'],
                    stack,
                    result_expression
                );
            }
            else {
                let message = result_table.oper_message['if_gt']
                while (stack.length > 0) {
                    top_symbol = stack.pop();
                    if (operators[top_symbol] >= operators[symbol]) {
                        result_expression += top_symbol + ' ';
                    }
                    else {
                        stack.push(top_symbol);
                        message = result_table.oper_message['to_stack']
                        break
                    }
                }
                stack.push(symbol);
                result_table.add_Tbody_Line(
                    symbol,
                    message,
                    stack,
                    result_expression
                );
            }
        }
        else {   // если symbol не ∈ к {operators}
            result_expression += symbol + ' '
            result_table.add_Tbody_Line(
                symbol,
                result_table.oper_message['to_out'],
                stack,
                result_expression
            );
        }
    }

    if (0 < result_expression.length) {
        let sm = '';
        while (sm = stack.pop()) {
            result_expression += sm + ' ';
        }

        result_table.add_Tbody_Line(
            '',
            result_table.oper_message['end_read'],
            '',
            result_expression
        );
    }

    cl(result_expression);
    return result_expression;
}


  class TableOfPolsk {
      constructor(table) {
          this.table = table;
          this.table_tbody = this.table.getElementsByTagName('tbody')[0];
          this.delete_All_Tbody_Lines();

          this.oper_message = {
              'to_out':   'добавить к выходной строке',
              'to_stack': 'поместить в стек',
              'if_)':     '1) присоединить содержимое стека до скобки в \
                              обратном порядке к выходной строке; \
                           2) удалить скобку из стека.',
              'if_gt':    '1) присоединить стек в обратном порядке \
                              к выходной строке; \
                           2) поместить новую операцию в стек.',
              'end_read': 'Присоедить стек в обратном порядке к выходной строке'
          };
      }

      delete_All_Tbody_Lines() {
          this.table.removeChild(this.table_tbody);
          this.create_Tbody();
      }

      create_Tbody() {
          this.table.append(document.createElement("tbody"));
          this.table_tbody = this.table.getElementsByTagName('tbody')[0];
      }

      add_Tbody_Line(symbol, operation, stack, outline) {
          let newLine = this.table_tbody.insertRow();
          [symbol, operation, stack, outline].forEach(
              row_content => newLine.insertCell().appendChild(
                  document.createTextNode(row_content)
              )
          );
      }
}
